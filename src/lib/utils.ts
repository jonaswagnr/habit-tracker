import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "@/lib/prisma"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let uniqueUsername = username;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username: uniqueUsername },
    });

    if (!existingUser) {
      return uniqueUsername;
    }

    uniqueUsername = `${username}${counter}`;
    counter++;
  }
}
