import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@prisma/client";

/**
 * Finds a single user by their email address (lowercased for case-insensitivity).
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Creates a new user record.
 */
export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
    },
  });
}

/**
 * Marks a user's email as verified by updating the emailVerified timestamp.
 */
export async function markEmailVerified(email: string): Promise<User> {
  return prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: new Date() },
  });
}

/**
 * Updates a user's password hash in the database.
 */
export async function updateUserPassword(email: string, passwordHash: string): Promise<User> {
  return prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { password: passwordHash },
  });
}
