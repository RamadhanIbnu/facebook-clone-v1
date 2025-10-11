import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../../lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const p = await params;
  const { postId } = p;
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // toggle like
  const existing = await prisma.like.findFirst({ where: { postId, userId } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { postId, userId } });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, include: { comments: true, likes: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const out = {
    id: post.id,
    userId: post.userId,
    content: post.content,
    image: post.image,
  likes: post.likes.map((l: { userId: string }) => l.userId),
  comments: post.comments.map((c: { id: string; userId: string; text: string; createdAt: Date }) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })),
    createdAt: post.createdAt,
  };
  return NextResponse.json({ post: out });
}
