"use server";

import { NextRequest, NextResponse } from 'next/server';
import {
  authMiddleware,
  redirectToLogin,
  redirectToHome,
} from 'next-firebase-auth-edge';
import authOptions from '@/utils/authOptions';
const PUBLIC_PATHS = ['/auth'];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    ...authOptions,
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    cookieSerializeOptions: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    },
    handleValidToken: async (_, headers: Headers) => {
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
