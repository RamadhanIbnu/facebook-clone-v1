import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromCookie } from "../../../lib/session";
type MessageOut = {
  id: string;
  userId: string | null;
  text: string;
  createdAt: Date;
  user?: { id: string; name: string | null; avatar?: string | null } | null;
};

type DbUser = { id: string; name: string; avatar?: string | null } | null;
type DbRec = { id: string; userId?: string | null; text: string; createdAt: string | Date; user?: DbUser; recipient?: DbUser };

export async function GET(req: Request) {
  try {
    // support optional recipientId query to fetch thread messages
    const url = new URL(req.url);
    const recipientId = url.searchParams.get('recipientId');
    const cookie = req.headers.get('cookie');
    const viewerId = getUserIdFromCookie(cookie);
  const messageDelegate = (prisma as unknown as Record<string, unknown>)['message'] as { findMany?: (args: unknown) => Promise<unknown[]> } | undefined;
    if (!messageDelegate || typeof messageDelegate.findMany !== 'function') {
      console.error('GET /api/messages error: prisma.message delegate missing');
      return NextResponse.json({ error: 'Message model not available' }, { status: 500 });
    }
  const where: Record<string, unknown> = {};
    if (recipientId) {
      // require authenticated viewer for thread access
      if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // return messages where (we sent to them) OR (they sent to us)
      where.OR = [
        { recipientId: recipientId, userId: viewerId },
        { recipientId: viewerId, userId: recipientId },
      ];
    }
    type DbUser = { id: string; name: string; avatar?: string | null } | null;
    type DbRec = { id: string; userId?: string | null; text: string; createdAt: string | Date; user?: DbUser; recipient?: DbUser };
    const recs = await messageDelegate.findMany({ include: { user: true }, where, orderBy: { createdAt: "desc" } });
    const mapped: MessageOut[] = (recs as DbRec[]).map((rec) => ({
      id: rec.id,
      userId: (rec.userId as string) ?? null,
      text: rec.text,
      createdAt: rec.createdAt as unknown as Date,
      user: rec.user ? { id: rec.user.id, name: rec.user.name, avatar: rec.user.avatar ?? null } : null,
    }));
    return NextResponse.json({ messages: mapped });
  } catch (err) {
    console.error("GET /api/messages error (prisma)", err);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.debug('POST /api/messages body:', body);
    const text = body && typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);

  const messageDelegateCreate = (prisma as unknown as Record<string, unknown>)['message'] as { create?: (args: unknown) => Promise<unknown> } | undefined;
  if (!messageDelegateCreate || typeof messageDelegateCreate.create !== 'function') {
    console.error('POST /api/messages error: prisma.message.create delegate missing');
    return NextResponse.json({ error: 'Message model not available' }, { status: 500 });
  }
  const recipientId = body && typeof body.recipientId === 'string' ? body.recipientId : undefined;
  // if recipientId provided, validate it exists to avoid DB FK errors
  if (recipientId) {
    try {
      const clientAny = prisma as unknown as Record<string, unknown>;
      const userDelegate = clientAny['user'] as { findUnique?: (args: unknown) => Promise<unknown> } | undefined;
      if (!userDelegate || typeof userDelegate.findUnique !== 'function') {
        console.error('POST /api/messages error: prisma.user delegate missing');
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
      const userRec = await userDelegate.findUnique({ where: { id: recipientId } } as unknown);
      if (!userRec) {
        console.warn('POST /api/messages: invalid recipientId', recipientId);
        return NextResponse.json({ error: 'Invalid recipientId' }, { status: 400 });
      }
    } catch (e) {
      console.error('POST /api/messages recipient lookup error', e);
      // On DB error, fail with 500 but include debug info in logs
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
  let created: unknown;
  try {
    created = await messageDelegateCreate.create({ data: { userId: userId ?? null, recipientId: recipientId ?? null, text }, include: { user: true } });
  } catch (createErr) {
    console.error('POST /api/messages create error', createErr);
    try { console.debug('POST /api/messages - payload for create', { userId, recipientId, text }); } catch {}
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
  const createdRec = created as unknown as DbRec;
  const out: MessageOut = {
      id: createdRec.id,
      userId: createdRec.userId ?? null,
      text: createdRec.text,
      createdAt: createdRec.createdAt as unknown as Date,
      user: createdRec.user ? { id: createdRec.user.id, name: createdRec.user.name, avatar: createdRec.user.avatar ?? null } : null,
    };
      // fire-and-forget publish to ws server
      try {
  const port = process.env.WS_PORT ?? '6789';
  const url = `http://127.0.0.1:${port}/publish`;
  // include recipientId so clients can filter to threads
  const payload = { type: 'message.created', message: out, recipientId: recipientId ?? null };
  // don't await to avoid slowing response
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
      } catch {}

      return NextResponse.json({ message: out }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
