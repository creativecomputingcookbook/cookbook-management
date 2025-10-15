import { NextRequest, NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';
import { Firestore } from '@google-cloud/firestore';

const db = new Firestore({ projectId: 'cwp-11ty' });
const allowedCollection = db.collection('allowed-emails');

// GET: List allowed emails
export async function GET() {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const docs = await allowedCollection.get();
  return NextResponse.json(docs.docs.map(d => d.id));
}

// POST: Add an allowed email
export async function POST(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { email, admin } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  await allowedCollection.doc(email).set({ email, admin });
  return NextResponse.json({ status: 'ok' });
}

// DELETE: Remove an allowed email
export async function DELETE(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  await allowedCollection.doc(email).delete();
  return NextResponse.json({ status: 'ok' });
}
