// src/app/api/habits/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        active: true
      },
      include: {
        entries: true,
      },
    });
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Check if an inactive habit with this name exists
    const existingHabit = await prisma.habit.findFirst({
      where: {
        name: json.name,
        active: false
      }
    });

    if (existingHabit) {
      // Reactivate the existing habit
      const updatedHabit = await prisma.habit.update({
        where: { id: existingHabit.id },
        data: { active: true }
      });
      return NextResponse.json(updatedHabit, { status: 200 });
    }

    // Create new habit if none exists
    const habit = await prisma.habit.create({
      data: { 
        name: json.name,
        active: true
      },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const json = await request.json();
    
    // Check if habit has entries
    const habit = await prisma.habit.findUnique({
      where: { id: json.id },
      include: { entries: true }
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    if (habit.entries.length === 0) {
      // Delete habit if no entries exist
      await prisma.habit.delete({
        where: { id: json.id }
      });
      return NextResponse.json({ message: 'Deleted' });
    } else {
      // Set habit to inactive if entries exist
      await prisma.habit.update({
        where: { id: json.id },
        data: { active: false }
      });
      return NextResponse.json({ message: 'Deactivated' });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove habit' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const { id, name } = json;
    
    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: { name }
    });
    
    return NextResponse.json(updatedHabit);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}