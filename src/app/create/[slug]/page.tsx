'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SchemaForm from '@/components/SchemaForm';
import { SchemaField } from '@/components/SchemaTypes';

export default function CreatePage() {
  const params = useParams();
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const slug = params.slug as string;
        const response = await fetch(`/api/schema/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Schema not found: ${slug}`);
        }
        
        const schemaData = await response.json();
        setSchema(schemaData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schema');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      loadSchema();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create {params.slug}
          </h1>
          <SchemaForm schema={schema} />
        </div>
      </div>
    </div>
  );
}
