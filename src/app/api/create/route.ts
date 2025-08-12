import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
) {
  const body = await request.json();
  console.log(body);
  // TODO: send to database
  return NextResponse.json({ comment: "todo" });
}
