import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  let user: Record<string, unknown> | null = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (prismaErr) {
      const errMsg = prismaErr instanceof Error ? prismaErr.message : String(prismaErr);
      if (errMsg.includes('prepared statement') || errMsg.includes('42P05')) {
        try {
          const conn = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
          if (!conn) throw new Error('no DB connection string for fallback');
          const pgModule = await import('pg');
          const Client = (pgModule as typeof import('pg')).Client;
          const c = new Client({ connectionString: conn });
          await c.connect();
          const q = await c.query('SELECT id, password, name, email FROM "User" WHERE email = $1 LIMIT 1', [email]);
          if (q && q.rows && q.rows.length > 0) user = q.rows[0] as Record<string, unknown>;
          await c.end();
        } catch (pgErr) {
          console.error('signin fallback pg error', pgErr instanceof Error ? pgErr.stack ?? pgErr.message : String(pgErr));
        }
      } else {
        throw prismaErr;
      }
    }

  if (!user) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const storedHash = typeof user.password === 'string' ? user.password : '';
  const ok = await bcrypt.compare(password, storedHash);
    if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const uid = String(user.id);
  const uname = typeof user.name === 'string' ? user.name : '';
  const uemail = typeof user.email === 'string' ? user.email : '';
  const token = signToken({ userId: uid });
  const res = NextResponse.json({ user: { id: uid, name: uname, email: uemail } });
    // set cookie with secure and sameSite for production
    const cookieOpts = { httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 };
    res.cookies.set("__session", token, cookieOpts);
    return res;
    } catch (err) {
      const out = err instanceof Error ? err.stack ?? err.message : String(err);
      console.error('POST /api/auth/signin error', out);
      const payload: Record<string, unknown> = { error: 'Server error' };
      if (process.env.NODE_ENV !== 'production') payload.stack = out;
      return NextResponse.json(payload, { status: 500 });
  }
}
