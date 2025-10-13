import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyToken, signToken } from "../../../../lib/auth";

export async function GET() {
  try {
    const nodeEnv = process.env.NODE_ENV ?? "undefined";
    const hasJwt = Boolean(process.env.JWT_SECRET);
    const ws = process.env.NEXT_PUBLIC_WS_URL ?? null;

    // Lightweight DB check: try a simple count on users (safe, fast)
    let dbOk = false;
    let userCount: number | null = null;
    try {
      userCount = await prisma.user.count();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    // Verify signing/verifying works using an ephemeral token (do NOT expose the secret)
    let jwtWorks = false;
    try {
      const t = signToken({ probe: "ok" }, { expiresIn: "1m" });
      const decoded = verifyToken(t);
      jwtWorks = decoded !== null;
    } catch {
      jwtWorks = false;
    }

    return NextResponse.json({
      nodeEnv,
      hasJwt,
      jwtWorks,
      dbOk,
      userCount,
      ws
    });
  } catch (err) {
    console.error('/api/_debug/runtime error', err);
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 });
  }
}
