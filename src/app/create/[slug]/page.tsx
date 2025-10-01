'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import SchemaForm from '@/components/SchemaForm';
import { Schema } from '@/components/SchemaTypes';
import Link from 'next/link';

export default function CreatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isDraft = searchParams.get('draft') === 'true';
  const [schema, setSchema] = useState<Schema>();
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
          {schema != undefined ? (<>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {isDraft ? 'Draft' : 'Create'} {schema.name} page
              </h1>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
            {isDraft && (
              <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                You are drafting a page. Drafts require admin approval to be published.
              </div>
            )}
            <SchemaForm schema={schema} />
          </>) : (
            <p>No schema loaded!</p>
          )}
        </div>
      </div>
    </div>
  );
}
