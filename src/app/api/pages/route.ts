import { Firestore } from '@google-cloud/firestore';
import { NextResponse } from 'next/server';

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
