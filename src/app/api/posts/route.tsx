import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromCookie } from "../../../lib/session";
import type { Post as PrismaPost, Comment as PrismaComment, Like as PrismaLike } from "@prisma/client";

// Local types for pg fallback rows
type PgPostRow = { id: string; userId: string; content?: string | null; image?: string | null; createdAt: string; u_id?: string; u_name?: string | null; u_avatar?: string | null };
type PgCommentRow = { id: string; postId: string; userId: string; text: string; createdAt: string };
type PgLikeRow = { postId: string; userId: string };
type PgUserRow = { id: string; name?: string | null; avatar?: string | null };
type PgClientCtor = new (opts: { connectionString: string }) => { connect(): Promise<void>; query(sql: string, params?: unknown[]): Promise<{ rows?: unknown[] }>; end(): Promise<void> };

export async function GET() {
  try {
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
  } catch (err) {
    console.error('GET /api/posts error', err);
    const msg = err instanceof Error ? err.message : String(err);
    // If this looks like a prepared-statement / prisma runtime error, try a pg fallback
    if (msg.includes('prepared statement') || msg.includes('42P05') || msg.includes('does not exist') || msg.includes('26000')) {
      try {
        const pgModule = await import('pg');
  const Client = (pgModule as unknown as { Client: PgClientCtor }).Client;
        const conn = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
        if (!conn) throw new Error('No DATABASE_URL for pg fallback');
        const c = new Client({ connectionString: conn });
        await c.connect();
        // Fetch posts with author info
        const postsQ = await c.query(
          'SELECT p.id, p."userId", p.content, p.image, p."createdAt", u.id as u_id, u.name as u_name, u.avatar as u_avatar FROM "Post" p JOIN "User" u ON u.id = p."userId" ORDER BY p."createdAt" DESC LIMIT 100',
        );
  const postRows: PgPostRow[] = (postsQ.rows ?? []) as unknown as PgPostRow[];
  const postIds: string[] = postRows.map((r) => r.id);
  let commentsRows: PgCommentRow[] = [];
  let likesRows: PgLikeRow[] = [];
  let commentUsersRows: PgUserRow[] = [];
        if (postIds.length > 0) {
          const commentsQ = await c.query('SELECT id, "postId", "userId", text, "createdAt" FROM "Comment" WHERE "postId" = ANY($1)', [postIds]);
          commentsRows = (commentsQ.rows ?? []) as unknown as PgCommentRow[];
          const likesQ = await c.query('SELECT "postId", "userId" FROM "Like" WHERE "postId" = ANY($1)', [postIds]);
          likesRows = (likesQ.rows ?? []) as unknown as PgLikeRow[];
          const commentUserIds = Array.from(new Set(commentsRows.map((r) => r.userId)));
          if (commentUserIds.length > 0) {
            const usersQ = await c.query('SELECT id, name, avatar FROM "User" WHERE id = ANY($1)', [commentUserIds]);
            commentUsersRows = (usersQ.rows ?? []) as unknown as PgUserRow[];
          }
        }
        await c.end();

        const commentUserMap = new Map<string, PgUserRow>(commentUsersRows.map((u) => [u.id, u]));
        const commentsByPost = new Map<string, PgCommentRow[]>();
        for (const cm of commentsRows) {
          const arr = commentsByPost.get(cm.postId) ?? [];
          arr.push(cm);
          commentsByPost.set(cm.postId, arr);
        }
        const likesByPost = new Map<string, string[]>();
        for (const lk of likesRows) {
          const arr = likesByPost.get(lk.postId) ?? [];
          arr.push(lk.userId);
          likesByPost.set(lk.postId, arr);
        }

        const out = postRows.map((r: PgPostRow) => ({
          id: r.id,
          userId: r.userId,
          user: r.u_id ? { id: r.u_id, name: r.u_name ?? null, avatar: r.u_avatar ?? null } : undefined,
          content: r.content ?? null,
          image: r.image ?? null,
          likes: likesByPost.get(r.id) ?? [],
          comments: (commentsByPost.get(r.id) ?? []).map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt, user: commentUserMap.get(c.userId) ?? null })),
          createdAt: r.createdAt,
        }));
        return NextResponse.json({ posts: out });
      } catch (pgErr) {
        console.error('pg fallback error for /api/posts', pgErr);
        const body: Record<string, unknown> = { error: msg };
        if (process.env.NODE_ENV !== 'production' && pgErr instanceof Error && pgErr.stack) body.stack = pgErr.stack;
        return NextResponse.json(body, { status: 500 });
      }
    }
    // otherwise return the original error in development
    const body: Record<string, unknown> = { error: msg };
    if (process.env.NODE_ENV !== 'production' && err instanceof Error && err.stack) body.stack = err.stack;
    return NextResponse.json(body, { status: 500 });
  }
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
