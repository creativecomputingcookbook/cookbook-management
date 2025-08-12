'use client';

import { useState } from 'react';
import FormField from './FormField';
import { InputField, SchemaField } from './SchemaTypes';

interface SchemaFormProps {
  schema: SchemaField[];
}

export default function SchemaForm({ schema }: SchemaFormProps) {
  // The form data is an object where the keys are field IDs and values are objects of properties;
  // essentially the handleSubmit should validate each key-value pair and add them to a fields array.
  const [formData, setFormData] = useState<Record<string, InputField>>({});

  const handleFieldChange = (fieldId: string, value: InputField) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData: InputField[] = [];
    for (const s of schema) {
      if (s.id in formData) {
        preparedData.push(formData[s.id]);
      }
      if (s.type == 'hidden' && s.extra_properties) {
        preparedData.push(s.extra_properties);
      }
    }
    console.log(preparedData);
    fetch('/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: preparedData })
    })
    .then(res => res.json())
    .then(data => {
      alert(JSON.stringify(data));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {schema.map((field, index) => (
        <FormField
          key={field.id || index}
          field={field}
          value={formData[field.id || index]}
          onChange={(value) => handleFieldChange(field.id, {...value, ...field.extra_properties})}
          hideHeading={true}
        />
      ))}
      
      <div className="pt-6 border-t border-gray-200">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Submit Form
        </button>
      </div>
    </form>
  );
}
