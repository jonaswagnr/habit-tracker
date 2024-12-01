// src/app/api/habits/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
        active: true
      },
      include: {
        entries: true,
      },
    });
    
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    
    const habit = await prisma.habit.create({
      data: {
        name: json.name,
        emoji: json.emoji,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(habit);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create habit" },
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
    const body = await request.json();
    const { id, name, emoji } = body;

    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: {
        name,
        emoji,
      },
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('Failed to update habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}