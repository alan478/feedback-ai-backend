import { SignJWT, jwtVerify } from "jose";
import prisma from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "frontdesk-dev-secret-change-in-prod"
);
const TOKEN_EXPIRY = "7d";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function generateToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return { userId: payload.userId as string, email: payload.email as string };
}

export async function authenticateRequest(
  req: Request
): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{
  user: { id: string; email: string; name: string | null };
  token: string;
}> {
  if (!EMAIL_REGEX.test(email)) {
    throw Object.assign(new Error("Invalid email format"), { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), {
      status: 409,
    });
  }

  const passwordHash = await Bun.password.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const token = await generateToken(user.id, user.email);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{
  user: { id: string; email: string; name: string | null };
  token: string;
}> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const token = await generateToken(user.id, user.email);
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}
