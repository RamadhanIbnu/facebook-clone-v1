import { NextResponse } from "next/server";
import { getUserIdFromCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ user: null });
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } catch (prismaErr) {
      const msg = prismaErr instanceof Error ? prismaErr.message : String(prismaErr);
      console.error('prisma.me error', msg);
      // Fallback to pg client if Prisma fails with prepared-statement issues
      if (msg.includes('prepared statement') || msg.includes('42P05') || msg.includes('does not exist')) {
        try {
          const pgModule = await import('pg');
          const Client = (pgModule as typeof import('pg')).Client;
          const conn = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
          if (conn) {
            const c = new Client({ connectionString: conn });
            await c.connect();
            const q = await c.query('SELECT id, name, email, title, avatar FROM "User" WHERE id = $1 LIMIT 1', [userId]);
            if (q && q.rows && q.rows.length > 0) user = q.rows[0] as Record<string, unknown>;
            await c.end();
          }
        } catch (pgErr) {
          console.error('pg fallback error', pgErr instanceof Error ? pgErr.stack ?? pgErr.message : String(pgErr));
        }
      }
    }
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, title: user.title ?? null, avatar: user.avatar ?? null } });
  } catch (err) {
    const out = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error('GET /api/auth/me unexpected error', out);
    // Return user null (200) to avoid client-side 500s for auth checks
    return NextResponse.json({ user: null });
  }
}
