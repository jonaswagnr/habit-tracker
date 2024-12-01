import { prisma } from './prisma';

export async function migrateHabitOrder() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Update order for each habit
    await Promise.all(
      habits.map((habit, index) =>
        prisma.habit.update({
          where: { id: habit.id },
          data: { order: index },
        })
      )
    );
  }
} 