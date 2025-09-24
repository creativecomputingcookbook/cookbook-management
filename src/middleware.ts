"use server";

import { NextRequest, NextResponse } from 'next/server';
import {
  authMiddleware,
  redirectToLogin,
  redirectToHome,
} from 'next-firebase-auth-edge';

const PUBLIC_PATHS = ['/auth'];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    cookieName: process.env.AUTH_COOKIE_NAME || 'AuthToken',
    cookieSignatureKeys: [process.env.COOKIE_SIGNATURE_KEY || 'dev-change-me-32-bytes-long!!!'],
    cookieSerializeOptions: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    },
    ...(process.env.NODE_ENV === 'development' ? {
      serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.PRIVATE_CLIENT_EMAIL!,
        privateKey: process.env.PRIVATE_PRIVATE_KEY!,
      }
    } : {}),
  handleValidToken: async (_tokens: unknown, headers: Headers) => {
      // Prevent authenticated users from opening the login page
      if (PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
        return redirectToHome(request);
      }
      return NextResponse.next({ request: { headers } });
    },
    handleInvalidToken: async (reason: unknown) => {
      console.info('Invalid token reason:', reason);
      return redirectToLogin(request, { path: '/auth', publicPaths: PUBLIC_PATHS });
    },
    handleError: async (error: unknown) => {
      console.error('next-firebase-auth-edge error:', error);
      return redirectToLogin(request, { path: '/auth', publicPaths: PUBLIC_PATHS });
    },
    getMetadata: async (tokens) => {
      return { admin: tokens.decodedIdToken.admin || false };
    },
    debug: process.env.NODE_ENV !== 'production',
  });
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)'],
};
