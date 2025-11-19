'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import SchemaForm from '@/components/SchemaForm';
import { PageData, Schema } from '@/components/SchemaTypes';
import Link from 'next/link';
import { useClaims } from '@/utils/useClaims';

export default function EditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const claims = useClaims();
  const router = useRouter();
  const isDraft = searchParams.get('staging') === 'true';
  const [data, setData] = useState<{ schema: Schema, pageData: PageData }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const slug = params.slug as string;
        const response = await fetch(`/api/${isDraft ? 'staging/' : ''}page/${slug}`);
        
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
  }, [isDraft, params.slug]);

  async function handleDelete() {
    if (!params.slug) return;
    if (!confirm('Are you sure you want to delete this draft?')) return;
    const res = await fetch(`/api/staging/pages?name=${encodeURIComponent(params.slug as string)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      router.push('/');
    } else {
      alert('Failed to delete draft.');
    }
  }
  async function handlePromote() {
    if (!params.slug) return;
    if (!confirm('Promote this draft to production?')) return;
    const res = await fetch('/api/staging/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: params.slug }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      alert('Failed to promote draft.');
    }
  }

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
          {data != undefined ? (<>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit &quot;{data.pageData.title}&quot; page
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
                This is a draft page. Drafts require admin approval to be published.
              </div>
            )}
            <SchemaForm schema={data.schema} pageData={data.pageData} />
            {/* Admin actions for drafts */}
            {isDraft && claims?.admin && (
              <div className="mt-8 flex flex-row space-x-4">
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={handlePromote}
                >
                  Promote to Production
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleDelete}
                >
                  Delete Draft
                </button>
              </div>
            )}
            {/* User delete for own drafts */}
            {isDraft && !claims?.admin && (
              <div className="mt-8 flex flex-row">
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleDelete}
                >
                  Delete Draft
                </button>
              </div>
            )}
          </>) : (
            <p>No page loaded!</p>
          )}
        </div>
      </div>
    </div>
  );
}
