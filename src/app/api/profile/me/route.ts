import { NextResponse } from "next/server";
import { getUserIdFromCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/prisma";

type UserPublic = { id: string; name: string; email: string | null; title: string | null; avatar: string | null };

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ user: null }, { status: 401 });
  const userRec = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRec) return NextResponse.json({ user: null }, { status: 404 });
  const u = userRec as unknown as UserPublic;
  const posts = await prisma.post.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { comments: true, likes: true } });
  return NextResponse.json({
    user: { id: u.id, name: u.name, email: u.email, title: u.title, avatar: u.avatar },
    posts: posts.map((p) => ({ id: p.id, userId: p.userId, content: p.content, image: p.image, likes: p.likes.map((l) => l.userId), comments: p.comments.map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })), createdAt: p.createdAt })),
  });
}
