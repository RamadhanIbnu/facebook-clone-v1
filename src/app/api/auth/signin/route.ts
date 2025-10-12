import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "invalid" }, { status: 401 });
    const ok = await bcrypt.compare(password, user.password ?? "");
    if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
    const token = signToken({ userId: user.id });
    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    // set cookie with secure and sameSite for production
    const cookieOpts = { httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 };
    res.cookies.set("__session", token, cookieOpts);
    return res;
  } catch (err) {
    console.error('POST /api/auth/signin error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
