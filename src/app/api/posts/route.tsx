import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromCookie } from "../../../lib/session";
import type { Post as PrismaPost, Comment as PrismaComment, Like as PrismaLike } from "@prisma/client";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { comments: { include: { user: true } }, likes: true, user: true },
  });
  // return client-friendly shape
  type UserShape = { id: string; name: string | null; avatar?: string | null } | undefined;
  const out = posts.map((p) => {
    const post = p as PrismaPost & { comments: (PrismaComment & { user?: UserShape })[]; likes: PrismaLike[]; user?: UserShape };
    return {
      id: post.id,
      userId: post.userId,
      user: post.user ? { id: post.user.id, name: post.user.name, avatar: post.user.avatar ?? null } : undefined,
      content: post.content,
      image: post.image,
      likes: post.likes.map((l) => l.userId),
      comments: post.comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        user: c.user ? { id: c.user.id, name: c.user.name, avatar: c.user.avatar ?? null } : undefined,
        text: c.text,
        createdAt: c.createdAt,
      })),
      createdAt: post.createdAt,
    };
  });
  return NextResponse.json({ posts: out });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { content, image } = body;
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const post = await prisma.post.create({ data: { userId, content, image }, include: { user: true } });
  const out = {
    id: post.id,
    userId: post.userId,
    user: post.user ? { id: post.user.id, name: post.user.name, avatar: post.user.avatar ?? null } : undefined,
    content: post.content,
    image: post.image,
    likes: [],
    comments: [],
    createdAt: post.createdAt,
  };
  return NextResponse.json({ post: out }, { status: 201 });
}
