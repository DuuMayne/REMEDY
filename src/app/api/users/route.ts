import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { displayName: 'asc' } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, displayName, role } = body;
  if (!email || !displayName) {
    return NextResponse.json({ error: 'email and displayName required' }, { status: 400 });
  }
  const user = await prisma.user.upsert({
    where: { email },
    update: { displayName, role: role || 'owner' },
    create: { email, displayName, role: role || 'owner' },
  });
  return NextResponse.json(user);
}
