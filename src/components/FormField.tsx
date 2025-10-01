'use client';

import { useState, useEffect } from 'react';
import { InputField, FormFieldProps } from './SchemaTypes';
import SimpleFormField from './SimpleFormField';

export default function FormField({ field, value, onChange }: FormFieldProps) {
  let initialItems: InputField[] = [];
  if (value) {
    initialItems = value[field.binding ?? "fields"] as InputField[] ?? [];
  }
  const [items, setItems] = useState<InputField[]>(initialItems);
  const [availablePages, setAvailablePages] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Fetch available pages for page_list type
  useEffect(() => {
    if (field.type === 'page_list') {
      fetch('/api/admin/pages')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAvailablePages(data);
          }
        })
        .catch(error => {
          console.error('Error fetching pages:', error);
        });
    }
  }, [field.type]);

  // Handle hidden fields (no UI, just extra properties)
  if (field.type === 'hidden') {
    return null;
  }

  if (field.type === 'page_list') {
    const currentPages = value ? (value[field.binding ?? field.id] as string[] || []) : [];
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setShowDropdown(true);
    };

    const handlePageSelect = (page: string) => {
      if (!currentPages.includes(page)) {
        const updatedPages = [...currentPages, page];
        onChange({ ...value, [field.binding ?? field.id]: updatedPages });
      }
      setInputValue('');
      setShowDropdown(false);
    };

    const handleRemovePage = (pageToRemove: string) => {
      const updatedPages = currentPages.filter(page => page !== pageToRemove);
      onChange({ ...value, [field.binding ?? field.id]: updatedPages });
    };

    const filteredPages = availablePages.filter(page =>
      page.toLowerCase().includes(inputValue.toLowerCase()) && !currentPages.includes(page)
    );

    return (
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.name}
          </label>
          <p className="text-sm text-gray-500 mb-4">{field.description}</p>
        </div>

        {/* Display selected pages */}
        {currentPages.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Pages:
            </label>
            <div className="space-y-2">
              {currentPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md">
                  <span className="text-sm">{page}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePage(page)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new page input */}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Type to search for pages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {showDropdown && filteredPages.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredPages.map((page, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePageSelect(page)}
                >
                  {page}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (field.type === 'open_field_list') {
    const addItem = () => {
      const newItem = { type: field.choices?.[0]?.type || '' };
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      onChange({ ...value, [field.binding ?? 'fields']: updatedItems });
    };

    const removeItem = (index: number) => {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      onChange({ ...value, [field.binding ?? 'fields']: updatedItems });
    };

    const updateItem = (index: number, itemData: InputField) => {
      const updatedItems = items.map((item, i) => 
        i === index ? ('type' in itemData ? itemData : { ...item, ...itemData }) : item
      );
      setItems(updatedItems);
      onChange({ ...value, [field.binding ?? 'fields']: updatedItems });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.name}
          </label>
          <p className="text-sm text-gray-500 mb-4">{field.description}</p>
        </div>

        {field.extra_inputs?.map((extraField, extraIndex) => (
          <div key={extraIndex} className="mb-3">
          <SimpleFormField
            field={extraField}
            value={{[extraField.binding ?? extraField.id]: value ? value[extraField.binding ?? extraField.id] : undefined}}
            onChange={(v: InputField) => onChange({ ...value, ...v })}
            hideHeading={false}
          />
          </div>
        ))}

        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Item {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            
            {/* Type selector dropdown. Should hide if only one choice */
              field?.choices?.length && field?.choices?.length > 1 ? (<div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={item.type as string || ''}
                  onChange={(e) => updateItem(index, { type: e.target.value })}
                >
                  <option value="">Select a type...</option>
                  {field.choices?.map((choice, choiceIndex) => (
                    <option key={choiceIndex} value={choice.type}>
                      {choice.name}
                    </option>
                  ))}
                </select>
              </div>) : (<></>)
            }

            {/* Render the selected choice field */
            item && field.choices?.map((choice, choiceIndex) => {
              if (choice.type === item.type || field.choices?.length == 1) {
                return (
                  <div key={choiceIndex} className="mb-3">
                    <SimpleFormField
                      field={choice}
                      value={item}
                      onChange={(value: InputField) => updateItem(index, value)}
                      hideHeading={true}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          + Add Item
        </button>
      </div>
    );
  }

  // Handle regular fields
  return <SimpleFormField field={field} value={value} onChange={onChange} hideHeading={field.extra_inputs == undefined} />;
}
