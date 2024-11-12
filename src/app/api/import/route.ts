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
    
    // Process each habit
    for (const habit of data.habits) {
      if (!habit.name) {
        console.warn('Skipping habit with no name:', habit);
        continue;
      }

      console.log('Processing habit:', habit.name);

      // Create or update habit
      const existingHabit = await prisma.habit.findFirst({
        where: { 
          name: habit.name,
          active: true
        }
      });

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
              emoji: habit.emoji
            }
          });

      console.log('Habit record:', habitRecord);

      // Process entries for this habit
      if (Array.isArray(habit.entries)) {
        for (const entry of habit.entries) {
          if (!entry.date) {
            console.warn('Skipping entry with no date:', entry);
            continue;
          }

          try {
            const entryDate = new Date(entry.date);
            if (isNaN(entryDate.getTime())) {
              console.warn('Invalid date:', entry.date);
              continue;
            }

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