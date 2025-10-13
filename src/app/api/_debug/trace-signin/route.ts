import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function GET() {
  // Safety: only allow in non-production to avoid leaking info
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }

  try {
    const email = "demo@local.test";
    const password = "password";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "user-not-found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, user.password ?? "");
    if (!ok) {
      return NextResponse.json({ error: "invalid-password" }, { status: 401 });
    }

    const token = signToken({ userId: user.id });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email }, tokenLength: token.length });
  } catch (err) {
    const out = err instanceof Error ? { message: err.message, stack: err.stack ?? null } : { message: String(err), stack: null };
    console.error("_debug/trace-signin error", out);
    return NextResponse.json({ error: out.message, stack: out.stack }, { status: 500 });
  }
}
