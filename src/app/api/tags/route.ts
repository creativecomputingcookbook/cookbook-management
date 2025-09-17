import { Firestore } from '@google-cloud/firestore';
import { NextRequest, NextResponse } from 'next/server';

const db = new Firestore({
  projectId: 'cwp-11ty',
});
const collection = db.collection('cwp-tags');

export async function GET() {
  try {
    const docs = await collection.get();
    
    return NextResponse.json(docs.docs.map(d => ({ name: d.id, category: d.get('category') })));
  } catch (error) {
    console.error('Error loading page list:', error);
    return NextResponse.json(
      { error: "Could not load a list of tags" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const body = await request.json();
  const docRef = collection.doc(body.name);
  if (!body.edit) {
    const d = await docRef.get();
    if (d.exists) {
      return NextResponse.json(
        { error: `Page "${body.title}" already exists. Set edit to true if you want to change this tag.` },
        { status: 400 }
      );
    }
  }
  if (process.env.WRITE === "1") {
    docRef.set({ category: body.category });
    return NextResponse.json({ status: "ok" });
  }
  return NextResponse.json({ status: "write disabled" });
}

export async function DELETE(
  request: NextRequest,
) {
  const { searchParams } = new URL(request.url);
  const tagName = searchParams.get('name');
  
  if (!tagName) {
    return NextResponse.json(
      { error: "Tag name is required" },
      { status: 400 }
    );
  }
  
  try {
    const docRef = collection.doc(tagName);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: `Tag "${tagName}" does not exist` },
        { status: 404 }
      );
    }
    
    if (process.env.WRITE === "1") {
      await docRef.delete();
      return NextResponse.json({ status: "ok" });
    }
    
    return NextResponse.json({ status: "write disabled" });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: "Could not delete tag" },
      { status: 500 }
    );
  }
}

