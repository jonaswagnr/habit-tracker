import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body);

    if (!body?.habits?.length) {
      return NextResponse.json(
        { error: 'Invalid request format', details: 'No habits provided' },
        { status: 400 }
      );
    }

    const results: string[] = [];
    
    // Get existing habits
    const existingHabits = await prisma.habit.findMany({
      where: { 
        userId: session.user.id,
        active: true 
      },
      select: { name: true, id: true, order: true }
    });

    // Process each habit
    for (const habit of body.habits) {
      try {
        if (!habit.name) {
          results.push('Skipping habit with no name');
          continue;
        }

        // Find existing habit
        const existingHabit = existingHabits.find(h => h.name === habit.name);

        // Prepare habit data
        const habitData = {
          name: habit.name,
          active: true,
          emoji: habit.emoji || '',
          ...(existingHabit ? {} : { userId: session.user.id }),
          ...(typeof habit.order === 'number' ? { order: habit.order } : {})
        };

        // Create or update habit
        const habitRecord = existingHabit 
          ? await prisma.habit.update({
              where: { id: existingHabit.id },
              data: habitData
            })
          : await prisma.habit.create({
              data: habitData
            });

        // Process entries if they exist
        if (Array.isArray(habit.entries)) {
          for (const entry of habit.entries) {
            if (!entry.date) continue;

            try {
              const entryDate = new Date(entry.date);
              if (isNaN(entryDate.getTime())) continue;

              await prisma.habitEntry.upsert({
                where: {
                  habitId_date: {
                    habitId: habitRecord.id,
                    date: entryDate
                  }
                },
                update: {
                  completed: Boolean(entry.completed),
                  journal: entry.journal || ''
                },
                create: {
                  habitId: habitRecord.id,
                  date: entryDate,
                  completed: Boolean(entry.completed),
                  journal: entry.journal || ''
                }
              });
            } catch (entryError) {
              results.push(`Error processing entry for ${habit.name}: ${entryError.message}`);
            }
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