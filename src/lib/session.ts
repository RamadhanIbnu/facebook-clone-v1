import { verifyToken } from "./auth";
import type { JwtPayload } from "jsonwebtoken";

export function getUserIdFromCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/__session=([^;]+)/);
  if (!m) return null;
  const token = decodeURIComponent(m[1]);
  const payload = verifyToken(token) as JwtPayload | null;
  if (!payload) return null;
  const userId = payload.userId as string | undefined;
  return userId ?? null;
}
