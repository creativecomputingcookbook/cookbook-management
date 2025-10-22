"use client";

import * as React from 'react';
import Head from 'next/head';
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { useRouter } from 'next/navigation';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) initializeApp(firebaseConfig);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const auth = getAuth();
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            const idToken = await result.user.getIdToken();
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) throw new Error('Login failed');
            router.refresh();
            router.push('/');
          })
          .catch((err) => {
            setError(err?.message || 'Sign-in failed');
          });
      } else {
        setError('No email found for sign-in. Please try again.');
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const auth = getAuth();
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin + '/auth',
        handleCodeInApp: true,
      });
      window.localStorage.setItem('emailForSignIn', email);
      setInfo('A sign-in link has been sent to your email if it has been authorized to access. Please check your inbox.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : String(err);
      if (msg.includes('Unauthorized email')) {
        setInfo('A sign-in link has been sent to your email if it has been authorized to access. Please check your inbox.');
      }
      else if (msg.includes('Too many requests. Try again later.')) setError('Too many requests. Please try again later.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Login | My App</title>
        <meta name="description" content="Welcome to My App" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {/* {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )} */}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Sending link...' : 'Send sign-in link'}
              </button>
            </div>
          </form>
          {info && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-700">{info}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}