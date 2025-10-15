import { NextRequest, NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, applicationDefault } from 'firebase-admin/app';

declare global {
  var _firebaseAdminInitialized: boolean | undefined;
}
if (!global._firebaseAdminInitialized) {
  initializeApp({ credential: applicationDefault() });
  global._firebaseAdminInitialized = true;
}

// GET: List users
export async function GET() {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const auth = getAuth();
  const users = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users.map(u => ({ email: u.email, uid: u.uid, admin: u.customClaims?.admin || false })));
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return NextResponse.json(users);
}

// POST: Promote user to admin
export async function POST(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { uid } = await request.json();
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { admin: true });
  return NextResponse.json({ status: 'ok' });
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });
  const auth = getAuth();
  await auth.deleteUser(uid);
  return NextResponse.json({ status: 'ok' });
}
