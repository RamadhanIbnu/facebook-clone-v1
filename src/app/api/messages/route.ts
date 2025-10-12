import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserIdFromCookie } from "../../../lib/session";
import type { Prisma } from "@prisma/client";

type MessageOut = {
  id: string;
  userId: string | null;
  text: string;
  createdAt: Date;
  user?: { id: string; name: string | null; avatar?: string | null } | null;
};

export async function GET() {
  try {
    // `message` is available on the generated Prisma client once migrations + `prisma generate` have run.
    // Access it dynamically and cast the result to the typed payload to keep mapping strictly typed.
  const messageDelegate = prisma['message'] as unknown as { findMany: (args: Prisma.MessageFindManyArgs) => Promise<Prisma.MessageGetPayload<{ include: { user: true } }>[] > };
  const recs = await messageDelegate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } } as Prisma.MessageFindManyArgs);
    const mapped: MessageOut[] = recs.map((rec) => ({
      id: rec.id,
      userId: rec.userId ?? null,
      text: rec.text,
      createdAt: rec.createdAt,
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
    const text = body && typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);

  const messageDelegateCreate = prisma['message'] as unknown as { create: (args: Prisma.MessageCreateArgs) => Promise<Prisma.MessageGetPayload<{ include: { user: true } }>> };
  const created = await messageDelegateCreate.create({ data: { userId: userId ?? null, text }, include: { user: true } } as Prisma.MessageCreateArgs);
    const out: MessageOut = {
      id: created.id,
      userId: created.userId ?? null,
      text: created.text,
      createdAt: created.createdAt,
      user: created.user ? { id: created.user.id, name: created.user.name, avatar: created.user.avatar ?? null } : null,
    };
      // fire-and-forget publish to ws server
      try {
        const port = process.env.WS_PORT ?? '6789';
        const url = `http://127.0.0.1:${port}/publish`;
        // don't await to avoid slowing response
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'message.created', message: out }) }).catch(() => {});
      } catch {}

      return NextResponse.json({ message: out }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
