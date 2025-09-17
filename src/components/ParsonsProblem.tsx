'use client';

import { useState, useEffect } from 'react';

export interface ParsonsFragment {
  id: string;
  code: string;
  comment: string;
  isDistractor: boolean;
  indentation: number; // Number of 2-space indent levels
}

interface ParsonsProblemProps {
  value?: string;
  onChange: (value: string) => void;
}

// Parse the raw text into fragments
function parseFragments(text: string): ParsonsFragment[] {
  if (!text.trim()) return [];
  
  const lines = text.split('\n');
  const fragments: ParsonsFragment[] = [];
  let currentFragment: Partial<ParsonsFragment> | null = null;
  let fragmentId = 0;

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Calculate indentation (number of 2-space groups)
    const leadingSpaces = originalLine.length - originalLine.trimStart().length;
    const indentation = Math.floor(leadingSpaces / 2);
    
    // Check for keywords
    const hasContinue = line.endsWith('#continue');
    const hasDistractor = line.endsWith('#distractor');
    
    // Extract code and comment
    let code = line;
    let comment = '';
    
    // Remove keywords first
    if (hasContinue) code = line.slice(0, -9).trim();
    if (hasDistractor) code = line.slice(0, -11).trim();
    
    // Extract comment (after // but before # keywords)
    const commentMatch = code.match(/^(.+?)\s*\/\/(.*)$/);
    if (commentMatch) {
      code = commentMatch[1].trim();
      comment = commentMatch[2].trim();
    }
    
    // Start new fragment if none exists
    if (!currentFragment) {
      currentFragment = {
        id: `fragment-${fragmentId++}`,
        code: code,
        comment: comment,
        isDistractor: hasDistractor,
        indentation: indentation
      };
    } else {
      // Continue existing fragment - preserve the original indentation of the first line
      currentFragment.code += '\n' + code;
      if (comment) {
        currentFragment.comment = currentFragment.comment 
          ? currentFragment.comment + ' ' + comment 
          : comment;
      }
      currentFragment.isDistractor = currentFragment.isDistractor || hasDistractor;
    }
    
    // Finish fragment if no continue
    if (!hasContinue) {
      fragments.push(currentFragment as ParsonsFragment);
      currentFragment = null;
    }
  }
  
  // Add any remaining fragment
  if (currentFragment) {
    fragments.push(currentFragment as ParsonsFragment);
  }
  
  return fragments;
}

// Convert fragments back to text format
function fragmentsToText(fragments: ParsonsFragment[]): string {
  return fragments.map(fragment => {
    const lines = fragment.code.split('\n');
    let result = '';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Add indentation (2 spaces per level)
      const indent = '  '.repeat(fragment.indentation);
      line = indent + line;
      
      // Add comment if this is the first line and we have a comment
      if (i === 0 && fragment.comment) {
        line += ' // ' + fragment.comment;
      }
      
      // Add continue keyword if not the last line
      if (i < lines.length - 1) {
        line += ' #continue';
      }
      
      // Add distractor keyword if this is a distractor and the last line
      if (fragment.isDistractor && i === lines.length - 1) {
        line += ' #distractor';
      }
      
      result += line + '\n';
    }
    
    return result.trim();
  }).join('\n\n');
}

export default function ParsonsProblem({ value = '', onChange }: ParsonsProblemProps) {
  const [mode, setMode] = useState<'freeform' | 'fragments'>('freeform');
  const [freeformText, setFreeformText] = useState(value);
  const [fragments, setFragments] = useState<ParsonsFragment[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize fragments from value
  useEffect(() => {
    if (value) {
      setFreeformText(value);
      setFragments(parseFragments(value));
    }
  }, [value]);

  // Switch to freeform mode
  const switchToFreeform = () => {
    const text = fragmentsToText(fragments);
    setFreeformText(text);
    setMode('freeform');
    onChange(text);
  };

  // Switch to fragments mode
  const switchToFragments = () => {
    const newFragments = parseFragments(freeformText);
    setFragments(newFragments);
    setMode('fragments');
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Update fragment
  const updateFragment = (index: number, updates: Partial<ParsonsFragment>) => {
    const newFragments = [...fragments];
    newFragments[index] = { ...newFragments[index], ...updates };
    setFragments(newFragments);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Delete fragment
  const deleteFragment = (index: number) => {
    const newFragments = fragments.filter((_, i) => i !== index);
    setFragments(newFragments);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Add new fragment
  const addFragment = () => {
    const newFragment: ParsonsFragment = {
      id: `fragment-${Date.now()}`,
      code: '// New code fragment',
      comment: '',
      isDistractor: false,
      indentation: 0
    };
    const newFragments = [...fragments, newFragment];
    setFragments(newFragments);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Adjust indentation
  const adjustIndentation = (index: number, direction: 'left' | 'right') => {
    const newFragments = [...fragments];
    const fragment = newFragments[index];
    
    if (direction === 'left' && fragment.indentation > 0) {
      fragment.indentation--;
    } else if (direction === 'right') {
      fragment.indentation++;
    }
    
    setFragments(newFragments);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Merge with next fragment
  const mergeWithNext = (index: number) => {
    if (index >= fragments.length - 1) return;
    
    const newFragments = [...fragments];
    const current = newFragments[index];
    const next = newFragments[index + 1];
    
    current.code += '\n' + next.code;
    if (next.comment) {
      current.comment = current.comment 
        ? current.comment + ' ' + next.comment 
        : next.comment;
    }
    current.isDistractor = current.isDistractor || next.isDistractor;
    
    newFragments.splice(index + 1, 1);
    setFragments(newFragments);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    
    const newFragments = [...fragments];
    const draggedFragment = newFragments[draggedIndex];
    
    // Remove dragged fragment
    newFragments.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newFragments.splice(insertIndex, 0, draggedFragment);
    
    setFragments(newFragments);
    setDraggedIndex(null);
    const text = fragmentsToText(newFragments);
    onChange(text);
  };

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={switchToFreeform}
          className={`px-3 py-1 rounded text-sm font-medium ${
            mode === 'freeform'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Freeform Input
        </button>
        <button
          type="button"
          onClick={switchToFragments}
          className={`px-3 py-1 rounded text-sm font-medium ${
            mode === 'fragments'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Drag & Arrange
        </button>
      </div>

      {/* Freeform mode */}
      {mode === 'freeform' && (
        <div>
          <textarea
            value={freeformText}
            onChange={(e) => {
              setFreeformText(e.target.value);
              onChange(e.target.value);
            }}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter Parsons problem code...
Use #continue to continue a fragment to the next line
Use #distractor to mark a fragment as a distractor
Use // for comments"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use <code>#continue</code> to continue a fragment, <code>#distractor</code> to mark as distractor, <code>{'//'}</code> for comments. Indentation (2 spaces) is preserved.
          </p>
        </div>
      )}

      {/* Fragments mode */}
      {mode === 'fragments' && (
        <div className="space-y-3">
          {fragments.map((fragment, index) => (
            <div
              key={fragment.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`p-3 border rounded-lg cursor-move transition-all ${
                fragment.isDistractor
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={fragment.isDistractor}
                      onChange={(e) => updateFragment(index, { isDistractor: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600">Distractor</span>
                  </label>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-gray-500">Indent:</span>
                    <button
                      type="button"
                      onClick={() => adjustIndentation(index, 'left')}
                      disabled={fragment.indentation === 0}
                      className="text-xs px-1 py-0.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded"
                    >
                      ←
                    </button>
                    <span className="text-xs text-gray-600 min-w-[1rem] text-center">
                      {fragment.indentation}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustIndentation(index, 'right')}
                      className="text-xs px-1 py-0.5 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="flex gap-1">
                  {index < fragments.length - 1 && (
                    <button
                      type="button"
                      onClick={() => mergeWithNext(index)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Merge ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteFragment(index)}
                    className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Code:
                  </label>
                  <div className="relative">
                    <div 
                      className="absolute left-2 top-1 text-sm font-mono text-gray-400 pointer-events-none"
                      style={{ 
                        whiteSpace: 'pre',
                        lineHeight: '1.5',
                        fontFamily: 'monospace'
                      }}
                    >
                      {fragment.code.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} style={{ height: '1.5em' }}>
                          {'    '.repeat(fragment.indentation)}
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={fragment.code}
                      onChange={(e) => updateFragment(index, { code: e.target.value })}
                      rows={Math.max(2, fragment.code.split('\n').length)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 relative z-10"
                      style={{ 
                        paddingLeft: `${8 + fragment.indentation * 16}px`,
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Comment:
                  </label>
                  <input
                    type="text"
                    value={fragment.comment}
                    onChange={(e) => updateFragment(index, { comment: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional comment"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addFragment}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            + Add Fragment
          </button>
        </div>
      )}
    </div>
  );
}
