import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcryptjs with a fixed cost of 12 rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Safely compares a plaintext password with a stored bcrypt hash.
 * Returns true if matched, false otherwise.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
