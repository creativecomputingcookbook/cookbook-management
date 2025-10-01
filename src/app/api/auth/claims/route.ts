import { NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';

export async function GET() {
  const claims = await verifyClaims();
  if (!claims) return NextResponse.json({}, { status: 401 });
  return NextResponse.json(claims);
}
