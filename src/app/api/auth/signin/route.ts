import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const ok = await bcrypt.compare(password, user.password ?? "");
  if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const token = signToken({ userId: user.id });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set("__session", token, { httpOnly: true, path: "/" });
  return res;
}
