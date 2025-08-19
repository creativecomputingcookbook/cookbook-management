'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SchemaForm from '@/components/SchemaForm';
import { PageData, Schema } from '@/components/SchemaTypes';

export default function EditPage() {
  const params = useParams();
  const [data, setData] = useState<{ schema: Schema, pageData: PageData }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const slug = params.slug as string;
        const response = await fetch(`/api/page/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Page not found: ${slug}.`);
        }

        const pageData: PageData = await response.json();
        const schemaName = pageData.schema ?? (
          pageData.tags.includes("Builds") ? "builds" : (
            pageData.tags.includes("Foundations") ? "foundations" : null
          ))
        if (!schemaName) throw new Error("Could not determine the appropriate schema for this page.");

        const schemaResponse = await fetch(`/api/schema/${schemaName}`);
        const schema = await schemaResponse.json();
        setData({ schema, pageData });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
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
          {
            data != undefined ? (<>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Edit &quot;{data.pageData.title}&quot; page
              </h1>
              <SchemaForm schema={data.schema} pageData={data.pageData} />
            </>) : (
              <p>No page loaded!</p>
            )
          }
        </div>
      </div>
    </div>
  );
}
