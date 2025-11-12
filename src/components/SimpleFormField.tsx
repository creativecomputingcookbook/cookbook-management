'use client';

import { InputField, FormFieldProps } from './SchemaTypes';
import ImageUpload from './ImageUpload';
import ParsonsProblem from './ParsonsProblem';
import { iFrameValidator } from '@/utils/iFrameValidator';
import React from 'react';

export default function SimpleFormField({ field, value, onChange, hideHeading }: FormFieldProps) {
  const [error, setError] = React.useState<string | null>(null);
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
          rows={field.short ? 1 :4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      
      {field.type === 'parsons' && (
        <ParsonsProblem
          value={value ? (value[field.binding ?? field.id] as string ?? '') : ''}
          onChange={(text) => onChange({[field.binding ?? field.id]: text})}
        />
      )}
      
      {field.type === 'image' && (
        <ImageUpload
          value={value ? (value[field.binding ?? field.id] as string) : undefined}
          onChange={(fileName) => onChange({ [field.binding ?? field.id]: fileName })}
        />
      )}
      
      {field.type === 'iframe' && (
        <>
          <input
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter URL"
            value={value ? (value[field.binding ?? field.id] as string ?? '') : ''}
            onChange={(e) => {
              const v = { [field.binding ?? field.id]: e.target.value };
              onChange(v);
            }}
            onBlur={(e) => {
              const v = { [field.binding ?? field.id]: e.target.value };
              try {
                iFrameValidator(field, v);
                setError(null);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (err: any) {
                setError(err.message);
              }
            }}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
