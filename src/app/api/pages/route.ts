import { Firestore } from '@google-cloud/firestore';
import { NextRequest, NextResponse } from 'next/server';

const db = new Firestore({
  projectId: 'cwp-11ty',
});
const collection = db.collection('cwp-pages');

export async function GET() {
  try {
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

export async function POST(
  request: NextRequest,
) {
  const body = await request.json();
  const docRef = collection.doc(body.title);
  if (!body.edit) {
    const d = await docRef.get();
    if (d.exists) {
      return NextResponse.json(
        { error: `Page "${body.title}" already exists. Set edit to true if you want to change this page.` },
        { status: 400 }
      );
    }
  }
  delete body.edit;
  if (process.env.WRITE === "1") {
    docRef.set(body);
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

