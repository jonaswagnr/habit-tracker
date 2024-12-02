// src/app/api/habits/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
        active: true,
      },
      include: {
        entries: {
          select: {
            date: true,
            completed: true,
            journal: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Ensure completed status is explicitly boolean
    const formattedHabits = habits.map(habit => ({
      ...habit,
      entries: habit.entries.map(entry => ({
        ...entry,
        completed: Boolean(entry.completed),
        date: entry.date.toISOString(),
      })),
    }));

    return NextResponse.json(formattedHabits);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" }, 
        { status: 401 }
      );
    }

    // Parse request body
    let json;
    try {
      json = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!json.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    try {
      // Get highest order
      const highestOrder = await prisma.habit.findFirst({
        where: {
          userId: session.user.id,
          active: true,
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const newOrder = (highestOrder?.order ?? -1) + 1;

      // Create habit
      const habit = await prisma.habit.create({
        data: {
          name: json.name,
          emoji: json.emoji || '',
          userId: session.user.id,
          order: newOrder,
        },
      });

      return NextResponse.json(habit);
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    // Log the actual error for debugging
    console.error('Unexpected error in habit creation:', error);
    
    return NextResponse.json(
      { error: "Internal server error" },
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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const orderUpdates = await request.json();
    
    if (!Array.isArray(orderUpdates)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Update each habit's order in a transaction
    await prisma.$transaction(
      orderUpdates.map((update) =>
        prisma.habit.update({
          where: {
            id: update.id,
            userId: session.user.id, // Ensure user owns the habit
          },
          data: {
            order: update.order,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating habits order:', error);
    return NextResponse.json(
      { error: 'Failed to update habits order' },
      { status: 500 }
    );
  }
}