import { NextResponse } from "next/server";
import { getUserIdFromCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
