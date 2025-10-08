import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromCookie } from "../../../lib/session";
import type { Post as PrismaPost, Comment as PrismaComment, Like as PrismaLike } from "@prisma/client";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { comments: true, likes: true },
  });
  // transform to client shape
  const out = posts.map((p: PrismaPost & { comments: PrismaComment[]; likes: PrismaLike[] }) => ({
    id: p.id,
    userId: p.userId,
    content: p.content,
    image: p.image,
    likes: p.likes.map((l) => l.userId),
    comments: p.comments.map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })),
    createdAt: p.createdAt,
  }));
  return NextResponse.json({ posts: out });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId: bodyUserId, content, image } = body;
  let userId = bodyUserId ?? undefined;
  if (!userId) {
    const cookie = req.headers.get("cookie");
    userId = getUserIdFromCookie(cookie) ?? undefined;
  }
  if (!userId || !content) return NextResponse.json({ error: "userId and content required" }, { status: 400 });
  const post = await prisma.post.create({ data: { userId, content, image } });
  const out = { id: post.id, userId: post.userId, content: post.content, image: post.image, likes: [], comments: [], createdAt: post.createdAt };
  return NextResponse.json({ post: out }, { status: 201 });
}
