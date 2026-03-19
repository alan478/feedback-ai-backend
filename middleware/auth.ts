import { authenticateRequest } from "../services/authService";

export async function requireAuth(
  req: Request
): Promise<{ userId: string; email: string }> {
  const user = await authenticateRequest(req);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}
