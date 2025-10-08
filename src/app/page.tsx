'use client';

import { useClaims } from '@/utils/useClaims';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const claims = useClaims();
  const router = useRouter();
  const [pages, setPages] = useState<string[]>([]);
  const [stagingPages, setStagingPages] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<{ name: string, id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('/api/admin/pages');
        if (!response.ok) {
          throw new Error('Failed to fetch pages');
        }
        const data = await response.json();
        setPages(data);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    const fetchStagingPages = async () => {
      try {
        const response = await fetch('/api/staging/pages');
        if (!response.ok) return;
        const data = await response.json();
        setStagingPages(data);
      } catch {}
    };
    const fetchSchemas = async () => {
      try {
        const response = await fetch('/api/schemas');
        if (!response.ok) {
          throw new Error('Failed to fetch schemas');
        }
        const data = await response.json();
        setSchemas(data);
      } catch (err) {
        setSchemaError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setSchemaLoading(false);
      }
    };

    fetchPages();
    fetchSchemas();
    fetchStagingPages();
  }, []);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-8 m-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create new page from schema...</h1>
          
          {schemaLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading schemas...</p>
            </div>
          )}
              
          {schemaError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error: {schemaError}</p>
            </div>
          )}
              
          {!schemaLoading && !schemaError && schemas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No schemas found.</p>
            </div>
          )}
              
          {!schemaLoading && !schemaError && schemas.length > 0 && (
            <div className="space-y-3">
              {schemas.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-medium text-gray-900">{s.name}</span>
                  {claims?.admin ? (
                    <div className="flex flex-row space-x-2 ml-auto">
                      <Link 
                        href={`/create/${s.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Create
                      </Link>
                      <Link 
                        href={`/create/${s.id}?draft=true`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                      >
                        Draft
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      href={`/create/${s.id}`}
                      className="inline-flex items-center mx-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Create
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Staging section for admin */}
        {claims?.admin && (
          <div className="bg-white rounded-lg shadow-sm border p-8 m-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Staging Pages</h1>
            {stagingPages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No staging pages found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stagingPages.map((page) => (
                  <div key={page} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-medium text-gray-900">{page}</span>
                    <Link 
                      href={`/edit/${page}?staging=true`}
                      className="inline-flex items-center px-4 py-2 mx-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                      Edit / Promote
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Staging section for non-admins */}
        {!claims?.admin && (
          <div className="bg-white rounded-lg shadow-sm border p-8 m-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Draft Pages (Staging)</h1>
            {stagingPages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No draft pages found. Drafts require admin approval to publish.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stagingPages.map((page) => (
                  <div key={page} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-medium text-gray-900">{page}</span>
                    <Link 
                      href={`/edit/${page}?staging=true`}
                      className="inline-flex items-center px-4 py-2 mx-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                      Edit Draft
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500">Drafts require admin approval to be published.</div>
          </div>
        )}
        {/* Production pages section (always visible) */}
        <div className="bg-white rounded-lg shadow-sm border p-8 m-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">List of Pages</h1>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading pages...</p>
            </div>
          )}
              
          {pageError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error: {pageError}</p>
            </div>
          )}
              
          {!loading && !pageError && pages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No pages found.</p>
            </div>
          )}
              
          {!loading && !pageError && pages.length > 0 && (
            <div className="space-y-3">
              {pages.map((pageName) => (
                <div key={pageName} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-medium text-gray-900">{pageName}</span>
                  {claims?.admin && (<Link 
                    href={`/edit/${pageName}`}
                    className="inline-flex items-center px-4 py-2 mx-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Edit Page
                  </Link>)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-8 m-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Tags</h1>
          <Link 
            href="/tags"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Manage Tags
          </Link>
        </div>
      </div>
    </div>
  );
}