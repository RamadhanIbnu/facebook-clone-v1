import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in production. Authentication tokens may be insecure or invalid.');
}

export function signToken(payload: Record<string, unknown>, opts?: jwt.SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", ...(opts ?? {}) });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded === "object" ? (decoded as JwtPayload) : null;
  } catch {
    return null;
  }
}
