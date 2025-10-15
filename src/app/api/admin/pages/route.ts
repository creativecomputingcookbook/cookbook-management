import { NextRequest, NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';
import { Firestore } from '@google-cloud/firestore';

const db = new Firestore({ projectId: 'cwp-11ty' });
const prodCollection = db.collection('cwp-pages');
const stagingCollection = db.collection('cwp-pages-staging');

// PATCH: Admin edits any page (staging or production)
// DELETE: Admin deletes any page (staging or production)
// POST: Admin creates a new page (staging or production)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staging = searchParams.get('staging') === 'true';
    const collection = staging ? stagingCollection : prodCollection;
    const docs = await collection.get();
    return NextResponse.json(docs.docs.map(d => d.id));
  } catch (error) {
    console.error('Error loading page list:', error);
    return NextResponse.json(
      { error: "Could not load a list of pages" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { title, staging } = body;
  if (!title) return NextResponse.json({ error: 'Page title required' }, { status: 400 });
  const collection = staging ? stagingCollection : prodCollection;
  const docRef = collection.doc(title);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: `Page "${title}" does not exist` }, { status: 404 });
  }
  const docData = doc.data();
  if (!docData) return NextResponse.json({ error: 'Page data missing' }, { status: 500 });
  // Prevent changing author
  body.user = docData.user;
  if (process.env.WRITE === "1") {
    await docRef.set(body);
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

export async function DELETE(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('name');
  const staging = searchParams.get('staging') === 'true';
  if (!title) return NextResponse.json({ error: 'Page title required' }, { status: 400 });
  const collection = staging ? stagingCollection : prodCollection;
  const docRef = collection.doc(title);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: `Page "${title}" does not exist` }, { status: 404 });
  }
  if (process.env.WRITE === "1") {
    await docRef.delete();
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

export async function POST(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { title, staging } = body;
  if (!title) return NextResponse.json({ error: 'Page title required' }, { status: 400 });
  const collection = staging ? stagingCollection : prodCollection;
  const docRef = collection.doc(title);
  const doc = await docRef.get();
  if (doc.exists) {
    return NextResponse.json({ error: `Page "${title}" already exists.` }, { status: 400 });
  }
  if (process.env.WRITE === "1") {
    await docRef.set(body);
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}
