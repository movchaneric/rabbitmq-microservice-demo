import bcrypt from "bcryptjs";

export interface User {
  email: string;
  passwordHash: string;
  role: "customer" | "admin";
}

const users = new Map<string, User>();

export async function register(
  email: string,
  password: string,
  role: "customer" | "admin",
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { email, passwordHash, role };
  users.set(email, user);
  return user;
}

export function findByEmail(email: string): User | undefined {
  return users.has(email) ? users.get(email) : undefined;
}
