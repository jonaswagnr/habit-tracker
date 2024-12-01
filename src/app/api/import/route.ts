import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { habits } = await request.json();
    const results: string[] = [];

    for (const habit of habits) {
      try {
        // First find or create the habit
        let dbHabit = await prisma.habit.findFirst({
          where: {
            userId: session.user.id,
            name: habit.name,
          },
        });

        if (!dbHabit) {
          dbHabit = await prisma.habit.create({
            data: {
              name: habit.name,
              emoji: habit.emoji || '',
              order: habit.order,
              userId: session.user.id,
            },
          });
        }

        // Process entries for this habit
        for (const entry of habit.entries) {
          // Try to find existing entry
          const existingEntry = await prisma.habitEntry.findFirst({
            where: {
              habitId: dbHabit.id,
              date: new Date(entry.date),
            },
          });

          if (existingEntry) {
            // Update existing entry
            await prisma.habitEntry.update({
              where: {
                id: existingEntry.id,
              },
              data: {
                completed: entry.completed,
                journal: entry.journal || '',
              },
            });
          } else {
            // Create new entry
            await prisma.habitEntry.create({
              data: {
                habitId: dbHabit.id,
                date: new Date(entry.date),
                completed: entry.completed,
                journal: entry.journal || '',
              },
            });
          }
        }

        results.push(`Successfully processed ${habit.name}`);
      } catch (habitError) {
        const errorMessage = habitError instanceof Error ? habitError.message : 'Unknown error';
        results.push(`Failed to process ${habit.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Failed to import data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 