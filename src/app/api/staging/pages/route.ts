import { Firestore } from '@google-cloud/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';

const db = new Firestore({ projectId: 'cwp-11ty' });
const collection = db.collection('cwp-pages-staging');

// GET: List pages created by the user in the staging collection
export async function GET() {
  const claims = await verifyClaims();
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = claims.uid;
  try {
    const docs = await collection.where('user', '==', user).get();
    return NextResponse.json(docs.docs.map(d => d.id));
  } catch (error) {
    console.error('Error loading staging pages:', error);
    return NextResponse.json({ error: 'Could not load staging pages' }, { status: 500 });
  }
}

// POST: Create a new page in the staging collection (user only)
export async function POST(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = claims.uid;
  const body = await request.json();
  const docRef = collection.doc(body.title);
  // Prevent duplicate in production or staging
  const prodDoc = await db.collection('cwp-pages').doc(body.title).get();
  const stagingDoc = await docRef.get();
  if (prodDoc.exists || stagingDoc.exists) {
    return NextResponse.json({ error: `Page "${body.title}" already exists in production or staging.` }, { status: 400 });
  }
  // Write to staging
  body.user = user;
  if (process.env.WRITE === "1") {
    await docRef.set(body);
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

// DELETE: Delete a user's own page in the staging collection
export async function DELETE(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = claims.uid;
  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get('name');
  if (!pageName) {
    return NextResponse.json({ error: 'Page name is required' }, { status: 400 });
  }
  const docRef = collection.doc(pageName);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: `Page "${pageName}" does not exist in staging` }, { status: 404 });
  }
  const docData = doc.data();
  if ((!docData || docData.user !== user) && !claims?.admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (process.env.WRITE === "1") {
    await docRef.delete();
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

// PATCH: Edit a user's own page in the staging collection
export async function PATCH(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = claims.uid;
  const body = await request.json();
  const docRef = collection.doc(body.title);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: `Page "${body.title}" does not exist in staging` }, { status: 404 });
  }
  const docData = doc.data();
  if (!docData || docData.user !== user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Prevent changing author
  body.user = docData.user;
  if (process.env.WRITE === "1") {
    await docRef.set(body);
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}
