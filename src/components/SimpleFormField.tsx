'use client';

import { InputField, FormFieldProps } from './SchemaTypes';

export default function SimpleFormField({ field, value, onChange, hideHeading }: FormFieldProps) {
  return (
    <div className="space-y-2">
      {hideHeading ? <></> : <h2>{field.name}</h2>}
      {
        field.extra_inputs?.map((extraField, extraIndex) => (
          <div key={extraIndex} className="mb-3">
          <SimpleFormField
            field={extraField}
            value={{[extraField.binding ?? extraField.id]: value ? value[extraField.binding ?? extraField.id] : undefined}}
            onChange={(v: InputField) => onChange({ ...value, ...v })}
            hideHeading={true}
          />
          </div>
        ))
      }
      <label className="block text-sm font-medium text-gray-700">
        {field.name}
      </label>
      <p className="text-sm text-gray-500">{field.description}</p>
      
      {field.type === 'text' && (
        <textarea
          value={value ? (value[field.binding ?? field.id] as string ?? '') : ''}
          onChange={(e) => onChange({[field.binding ?? field.id]: e.target.value})}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      
      {field.type === 'image' && (
        <input
          type="file"
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange({ [field.binding ?? field.id]: file });
            }
          }}
        />
      )}
      
      {field.type === 'iframe' && (
        <input
          type="url"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter URL"
          value={value ? (value[field.binding ?? field.id] as string ?? '') : ''}
          onChange={(e) => onChange({[field.binding ?? field.id]: e.target.value})}
        />
      )}
    </div>
  );
}
