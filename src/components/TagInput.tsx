'use client';

import { useState, useEffect, useRef } from 'react';

interface Tag {
  name: string;
  category: string;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder = "Add tags..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all tags on component mount
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAllTags(tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Get unique categories from all tags
  const getUniqueCategories = () => {
    const categories = new Set(allTags.map(tag => tag.category));
    return Array.from(categories).sort();
  };

  // Filter categories based on input
  const getFilteredCategories = () => {
    const categories = getUniqueCategories();
    if (categoryInput.length === 0) return categories;
    return categories.filter(cat => 
      cat.toLowerCase().includes(categoryInput.toLowerCase())
    );
  };

  // Handle input changes and show suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (query.length > 0) {
      // Filter tags by prefix search
      const filtered = allTags.filter(tag => 
        tag.name.toLowerCase().includes(query.toLowerCase()) &&
        !value.includes(tag.name)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add tag from suggestion
  const addTag = (tagName: string) => {
    if (!value.includes(tagName)) {
      onChange([...value, tagName]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  // Add tag from input (if it's a new tag)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tagName = inputValue.trim();
      if (tagName && !value.includes(tagName)) {
        // Check if this is a new tag (not in allTags)
        const existingTag = allTags.find(tag => tag.name === tagName);
        if (existingTag) {
          // Tag exists, add it directly
          onChange([...value, tagName]);
          setInputValue('');
          setShowSuggestions(false);
        } else {
          // New tag, prompt for category
          setNewTagName(tagName);
          setCategoryInput('');
          setShowCategoryPrompt(true);
          setInputValue('');
          setShowSuggestions(false);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // Handle category input changes
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCategoryInput(query);
    setShowCategorySuggestions(query.length > 0);
  };

  // Handle category selection
  const selectCategory = (category: string) => {
    setCategoryInput(category);
    setShowCategorySuggestions(false);
  };

  // Create new tag with category
  const createNewTag = async () => {
    if (!newTagName || !categoryInput.trim()) return;

    try {
      // Create the tag in the database
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName,
          category: categoryInput.trim(),
          edit: false,
        }),
      });

      if (response.ok) {
        // Add to local tags list
        const newTag = { name: newTagName, category: categoryInput.trim() };
        setAllTags(prev => [...prev, newTag]);
        
        // Add to form value
        onChange([...value, newTagName]);
        
        // Reset state
        setShowCategoryPrompt(false);
        setNewTagName('');
        setCategoryInput('');
        setShowCategorySuggestions(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to create tag: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. Please try again.');
    }
  };

  // Cancel category assignment
  const cancelCategoryAssignment = () => {
    setShowCategoryPrompt(false);
    setNewTagName('');
    setCategoryInput('');
    setShowCategorySuggestions(false);
  };

  // Group tags by category for display
  const getTagCategory = (tagName: string) => {
    const tag = allTags.find(t => t.name === tagName);
    return tag ? tag.category : 'Uncategorized';
  };

  const groupedTags = value.reduce((acc, tagName) => {
    const category = getTagCategory(tagName);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tagName);
    return acc;
  }, {} as Record<string, string[]>);

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategorySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Tags
      </label>
      <p className="text-sm text-gray-500">
        Add tags to categorize your page. Start typing to see suggestions.
      </p>
      
      {/* Display current tags grouped by category */}
      {Object.keys(groupedTags).length > 0 && (
        <div className="space-y-2">
          {Object.entries(groupedTags).map(([category, tags]) => (
            <div key={category} className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {category}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input field with suggestions */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            if (inputValue.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => addTag(tag.name)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-gray-500">{tag.category}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* No suggestions message */}
        {showSuggestions && suggestions.length === 0 && inputValue.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
          >
            <div className="px-4 py-2 text-gray-500 text-sm">
              No matching tags found. Press Enter to add &quot;{inputValue}&quot; as a new tag.
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="text-sm text-gray-500">Loading tags...</div>
      )}

      {/* Category Assignment Prompt */}
      {showCategoryPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Category for &quot;{newTagName}&quot;
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This is a new tag. Please assign it to a category.
            </p>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={handleCategoryInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createNewTag();
                    } else if (e.key === 'Escape') {
                      cancelCategoryAssignment();
                    }
                  }}
                  placeholder="Enter or select a category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                
                {/* Category suggestions dropdown */}
                {showCategorySuggestions && getFilteredCategories().length > 0 && (
                  <div
                    ref={categoryDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                  >
                    {getFilteredCategories().map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => selectCategory(category)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={createNewTag}
                  disabled={!categoryInput.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Tag
                </button>
                <button
                  type="button"
                  onClick={cancelCategoryAssignment}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
