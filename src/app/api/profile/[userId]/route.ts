import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../lib/session";

// Local helper types to avoid `any` usage in this file
type FollowCountFn = (args: { where: Record<string, unknown> }) => Promise<number>;
type FollowFindFirstFn = (args: { where: Record<string, unknown> }) => Promise<unknown>;

type LocalLike = { userId: string };
type LocalComment = { id: string; userId: string; text: string; createdAt: string; user?: { id: string; name: string; avatar?: string } | null };
type LocalPost = { id: string; userId: string; user?: { id: string; name: string; avatar?: string } | null; content?: string | null; image?: string | null; likes?: LocalLike[]; comments?: LocalComment[]; createdAt: string };

type PgClientCtor = new (opts: { connectionString: string }) => { connect(): Promise<void>; query(sql: string, params?: unknown[]): Promise<{ rows?: unknown[] }>; end(): Promise<void> };

// Full profile GET: primary path via Prisma, with a runtime pg fallback for prepared-statement
// or missing-model errors. Kept in one clean implementation to avoid duplicate-declaration issues.
export async function GET(req: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ user: null }, { status: 404 });

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { comments: { include: { user: true } }, likes: true, user: true },
    });

    // Defensive access to follow model (client may not include it if `prisma generate` wasn't run)
    const clientAny = prisma as unknown as { follow?: { count?: (args: unknown) => Promise<number>; findFirst?: (args: unknown) => Promise<unknown> } };
    let followersCount = 0;
    let followingCount = 0;
    let isFollowing = false;
    try {
      if (clientAny.follow && typeof clientAny.follow.count === 'function') {
        // follow model may be absent on the generated client; cast to narrow helper types
        const followCount = clientAny.follow.count as unknown as FollowCountFn;
        const followFindFirst = clientAny.follow.findFirst as unknown as FollowFindFirstFn | undefined;
        followersCount = await followCount({ where: { followingId: userId } });
        followingCount = await followCount({ where: { followerId: userId } });
        const cookie = req.headers.get('cookie');
        const viewerId = getUserIdFromCookie(cookie);
        if (viewerId && typeof followFindFirst === 'function') {
          const found = await followFindFirst({ where: { followerId: viewerId, followingId: userId } });
          isFollowing = !!found;
        }
      }
    } catch (err) {
      console.error('follow model error', String(err));
      followersCount = 0;
      followingCount = 0;
      isFollowing = false;
    }

    // cast posts to LocalPost[] for safer mapping without `any`
    const postsTyped = posts as unknown as LocalPost[];
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, title: user.title ?? null, avatar: user.avatar ?? null },
      posts: postsTyped.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user ? { id: p.user.id, name: p.user.name, avatar: p.user.avatar } : null,
        content: p.content ?? null,
        image: p.image ?? null,
        likes: (p.likes ?? []).map((l) => l.userId),
        comments: (p.comments ?? []).map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt, user: c.user ?? null })),
        createdAt: p.createdAt,
      })),
      followersCount,
      followingCount,
      isFollowing,
    });
  } catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
    console.error('prisma profile error', msg);
    // Detect prepared-statement / missing-model errors and try a light pg fallback
    if (msg.includes('prepared statement') || msg.includes('42P05') || msg.includes('does not exist') || msg.includes('26000')) {
      try {
        // use dynamic import so lint rules don't complain about require(); type via PgClientCtor
        const pgModule = await import('pg');
        const Client = (pgModule as unknown as { Client: PgClientCtor }).Client;
        const conn = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
        if (conn) {
          const c = new Client({ connectionString: conn });
          await c.connect();
          const q = await c.query('SELECT id, name, email, title, avatar FROM "User" WHERE id = $1 LIMIT 1', [userId]);
          await c.end();
          if (q && q.rows && q.rows.length > 0) {
            const ru = q.rows[0] as Record<string, unknown>;
            return NextResponse.json({ user: { id: String(ru.id), name: String(ru.name), email: ru.email ?? null, title: ru.title ?? null, avatar: ru.avatar ?? null }, posts: [], followersCount: 0, followingCount: 0, isFollowing: false });
          }
          return NextResponse.json({ user: null }, { status: 404 });
        }
      } catch (pgErr) {
        console.error('profile pg fallback error', String(pgErr));
        return NextResponse.json({ user: null }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
