import { Firestore } from '@google-cloud/firestore';
import { NextRequest, NextResponse } from 'next/server';

const db = new Firestore({
  projectId: 'cwp-11ty',
});
const collection = db.collection('cwp-pages');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {

    const docRef = await collection.doc(slug).get();
    const d = docRef.data();
    
    return NextResponse.json(d);
  } catch (error) {
    console.error('Error loading schema:', error);
    return NextResponse.json(
      { error: `Page "${slug}" not found` },
      { status: 404 }
    );
  }
}
