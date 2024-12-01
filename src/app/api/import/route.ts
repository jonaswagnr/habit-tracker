import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received import data:', data);

    if (!data.habits || !Array.isArray(data.habits)) {
      throw new Error('Invalid import data format');
    }

    const results = [];
    
    // Get existing habits
    const existingHabits = await prisma.habit.findMany({
      where: { active: true },
      select: { name: true, id: true }
    });

    // Process each habit
    for (const habit of data.habits) {
      if (!habit.name) {
        console.warn('Skipping habit with no name:', habit);
        continue;
      }

      console.log('Processing habit:', habit.name);

      // Find or create habit
      const existingHabit = existingHabits.find(h => h.name === habit.name);

      const habitRecord = existingHabit 
        ? await prisma.habit.update({
            where: { id: existingHabit.id },
            data: { 
              name: habit.name,
              active: true,
              emoji: habit.emoji
            }
          })
        : await prisma.habit.create({
            data: {
              name: habit.name,
              active: true,
              emoji: habit.emoji,
              userId: request.headers.get('userId') || '' // Make sure to pass userId in headers
            }
          });

      // Process entries for this habit
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
                journal: entry.journal
              },
              create: {
                habitId: habitRecord.id,
                date: entryDate,
                completed: Boolean(entry.completed),
                journal: entry.journal
              }
            });
          } catch (entryError) {
            console.error('Error processing entry:', entryError);
            results.push(`Error processing entry for ${habit.name} on ${entry.date}`);
          }
        }
      }

      results.push(`Successfully processed ${habit.name}`);
    }

    return NextResponse.json({ 
      message: 'Import completed',
      results 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 