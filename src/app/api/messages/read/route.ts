import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromCookie } from '../../../../lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const recipientId = body && typeof body.recipientId === 'string' ? body.recipientId : undefined;
    if (!recipientId) return NextResponse.json({ error: 'recipientId required' }, { status: 400 });
    const cookie = req.headers.get('cookie');
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // upsert conversation read cursor
    await prisma.conversationRead.upsert({
      where: { userId_otherUserId: { userId, otherUserId: recipientId } },
      update: { lastReadAt: new Date() },
      create: { userId, otherUserId: recipientId, lastReadAt: new Date() },
    });

    // mark message-level reads for messages in the thread up to now (best-effort)
    const msgs = await prisma.message.findMany({ where: { OR: [ { recipientId, userId }, { recipientId: userId, userId: recipientId } ] } });
    for (const m of msgs) {
      try {
        await prisma.messageRead.create({ data: { messageId: m.id, userId } });
      } catch {}
    }

    // publish presence/read via WS if available
    try { fetch(`http://127.0.0.1:${process.env.WS_PORT ?? 6789}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'conversation.read', userId, otherUserId: recipientId }) }); } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/messages/read error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
