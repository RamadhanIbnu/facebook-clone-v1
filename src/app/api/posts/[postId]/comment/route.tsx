import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../../lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const p = await params;
  const { postId } = p;
  const body = await req.json();
  const { text } = body;
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const comment = await prisma.comment.create({ data: { postId, userId, text } });
  if (!comment) return NextResponse.json({ error: "not found" }, { status: 404 });
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { comments: true, likes: true } });
  return NextResponse.json({ post: { id: post?.id, userId: post?.userId, content: post?.content, image: post?.image, likes: post?.likes.map((l: { userId: string }) => l.userId), comments: post?.comments.map((c: { id: string; userId: string; text: string; createdAt: Date }) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })), createdAt: post?.createdAt } });
}
