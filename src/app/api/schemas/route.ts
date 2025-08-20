import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // temporary basis
    return NextResponse.json([
      {name: "Builds", id: "builds"},
      {name: "Foundations", id: "foundations"},
    ]);
  } catch (error) {
    console.error('Error loading schema list:', error);
    return NextResponse.json(
      { error: "Could not load a list of schemas" },
      { status: 500 }
    );
  }
}
