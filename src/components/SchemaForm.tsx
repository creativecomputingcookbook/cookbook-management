'use client';

import { useState } from 'react';
import FormField from './FormField';
import { InputField, PageData, Schema } from './SchemaTypes';
import ImageUpload from './ImageUpload';

interface SchemaFormProps {
  schema: Schema;
  pageData?: PageData;
}

export default function SchemaForm({ schema, pageData }: SchemaFormProps) {
  // The form data is an object where the keys are field IDs and values are objects of properties;
  // essentially the handleSubmit should validate each key-value pair and add them to a fields array.

  const initialFormData: Record<string, InputField> = {};
  if (pageData) {
    for (let i = 0; i < pageData.fields.length; i++) {
      const pageField = pageData.fields[i], schemaField = schema.components[i];
      if (!schemaField.extra_properties || Object.keys(schemaField.extra_properties).every(key => 
        pageField.hasOwnProperty(key) && pageField[key] === schemaField.extra_properties![key]
      )) {
        initialFormData[schemaField.id] = pageField;
      }
    }
  }

  const [formData, setFormData] = useState<Record<string, InputField>>(initialFormData);
  const [meta, setMeta] = useState<Record<string, string | undefined>>({
    title: pageData?.title,
    shortDesc: pageData?.shortDesc,
    thumbnail: pageData?.thumbnail,
  });

  const handleFieldChange = (fieldId: string, value: InputField) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData: InputField[] = [];
    for (const s of schema.components) {
      if (s.id in formData) {
        preparedData.push(formData[s.id]);
      }
      if (s.type == 'hidden' && s.extra_properties) {
        preparedData.push(s.extra_properties);
      }
    }
    const body = {
      schema: schema.id,
      ...meta,
      fields: preparedData,
      edit: false, // determine if editing existing page
    }
    if (pageData) {
      body.edit = true;
    }
    fetch('/api/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
      alert(JSON.stringify(data));
    });
  };

  // TODO: tag field

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {pageData ? <p>
        You are editing page <span className="font-bold">{pageData.title}</span>.
      </p> : <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <textarea
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail
        </label>
        <p className="text-sm text-gray-500">Thumbnail for homepage listing and social media.</p>
        <ImageUpload
          value={meta.thumbnail}
          onChange={(fileName) => setMeta({ ...meta, thumbnail: fileName })}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Short description
        </label>
        <p className="text-sm text-gray-500">Short description for homepage listing and social media.</p>
        <textarea
          value={meta.shortDesc}
          onChange={(e) => setMeta({ ...meta, shortDesc: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {schema.components.map((field, index) => (
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
