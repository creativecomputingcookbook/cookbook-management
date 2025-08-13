import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Construct the path to the schema file
    const schemaPath = join(process.cwd(), 'src', 'schema', `${slug}.json`);
    
    // Read the schema file
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);
    
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error loading schema:', error);
    return NextResponse.json(
      { error: 'Schema not found' },
      { status: 404 }
    );
  }
}
