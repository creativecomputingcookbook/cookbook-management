'use client';

import { useState } from 'react';
import FormField from './FormField';
import { InputField, PageData, Schema, SchemaField } from './SchemaTypes';
import ImageUpload from './ImageUpload';
import TagInput from './TagInput';
import { useSearchParams } from 'next/navigation';

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
  const [tags, setTags] = useState<string[]>(pageData?.tags || []);
  const searchParams = useSearchParams();
  const isDraft = searchParams.get('draft') === 'true' || searchParams.get('staging') === 'true';

  const handleFieldChange = (fieldId: string, value: InputField) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const transformUrl = (type: string, url: string): string | null => {
    const patterns: Record<string, { match: RegExp[], to: string }> = {
      youtube: {
        match: [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
          /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
        ],
        to: "https://www.youtube.com/embed/{1}",
      },
      makecode: {
        match: [
          /(?:https?:\/\/)?makecode\.com\/_([a-zA-Z0-9]+)/,
          /(?:https?:\/\/)?maker.makecode\.com\/#pub:_([a-zA-Z0-9]+)/,
        ],
        to: "https://maker.makecode.com/#pub:_{1}",
      },
      arduino: {
        match: [
          /(?:https?:\/\/)?app\.arduino\.cc\/sketches\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})(?:\?view-mode=[a-z]+)/,
        ],
        to: "https://app.arduino.cc/sketches/{1}?view-mode=embed",
      }
    };
    if (!patterns[type]) return null;
    for (const pattern of patterns[type].match) {
      const match = url.match(pattern);
      if (match) {
        // Replace {1}, {2}, ... in the template with corresponding capture groups
        return patterns[type].to.replace(/{([0-9]+)}/g, (s) => match[parseInt(s)] ?? '');
      }
    }
    return null;
  };

  const iFrameValidator = (s: SchemaField, f: InputField): InputField => {
      if (s.type === 'iframe' && s.transform) {
        const key = s.binding ?? s.id;
        const currentValue = f[key];
        if (typeof currentValue === 'string') {
          const transformed = transformUrl(s.transform, currentValue);
          if (transformed) {
            f[key] = transformed;
            return f;
          } else {
            throw Error(`Invalid ${s.transform} link for field "${s.name}".`);
          }
        }
      }
      return f;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData: InputField[] = [];
    try {
      for (const s of schema.components) {
        if (s.id in formData) {
          if (s.type === 'open_field_list') {
            const key = s.binding ?? s.id;
            const currentValue = formData[s.id]?.[key];
            if (Array.isArray(currentValue)) {
              formData[s.id][key] = (currentValue as InputField[]).map(item => {
                const schemaField = s.choices?.find(choice => choice.type === item.type);
                if (!schemaField) throw Error(`Invalid item type "${item.type}" in open field list "${s.name}".`);
                return iFrameValidator(schemaField, item);
              });
            }
          }
          else formData[s.id] = iFrameValidator(s, formData[s.id]);
          preparedData.push(formData[s.id]);
        }
        if (s.type == 'hidden' && s.extra_properties) {
          preparedData.push(s.extra_properties);
        }
      }
    } catch (err: unknown) {
      alert((err as { message: unknown }).message);
      return;
    }
    const body = {
      schema: schema.id,
      ...meta,
      tags: tags,
      fields: preparedData,
      edit: false, // determine if editing existing page
      staging: isDraft,
    };
    if (pageData) {
      body.edit = true;
    }
    fetch(isDraft ? '/api/staging/pages' : '/api/admin/pages', {
      method: pageData ? 'PATCH' : 'POST',
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
      <TagInput
        value={tags}
        onChange={setTags}
        placeholder="Add tags to categorize your page..."
      />
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Short description
        </label>
        <p className="text-sm text-gray-500">Short description for homepage listing and social media.</p>
        <textarea
          value={meta.shortDesc}
          onChange={(e) => setMeta({ ...meta, shortDesc: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={100}
        />
        <p className="text-sm text-gray-500">{(meta.shortDesc || '').length}/100 characters</p>
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
