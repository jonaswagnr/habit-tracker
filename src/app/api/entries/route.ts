import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { habitId, date, completed, journal } = json;
    
    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId,
          date: new Date(date),
        },
      },
      update: {
        completed,
        journal,
      },
      create: {
        habitId,
        date: new Date(date),
        completed,
        journal,
      },
    });
    
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}