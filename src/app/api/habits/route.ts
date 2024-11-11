import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
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
    const habit = await prisma.habit.create({
      data: { name: json.name },
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
    await prisma.habit.delete({
      where: { id: json.id },
    });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}