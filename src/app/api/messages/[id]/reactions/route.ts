import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getUserIdFromCookie } from '../../../../../lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const messageId = p.id;
  try {
    const body = await req.json();
    const type = body && typeof body.type === 'string' ? body.type : undefined;
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 });
    const cookie = req.headers.get('cookie');
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // upsert reaction (if exists with same type, remove it)
    const clientAny = prisma as unknown as Record<string, unknown>;
  const reactionDelegate = clientAny['reaction'] as { findFirst?: (args: unknown) => Promise<unknown>, delete?: (args: unknown) => Promise<unknown>, create?: (args: unknown) => Promise<unknown> } | undefined;
    if (!reactionDelegate || typeof reactionDelegate.findFirst !== 'function') {
      console.error('POST /api/messages/[id]/reactions error: prisma.reaction delegate missing');
      return NextResponse.json({ error: 'Reaction model not available' }, { status: 500 });
    }

    const existing = await reactionDelegate.findFirst!({ where: { messageId, userId, type } } as unknown) as { id: string } | null;
    if (existing && existing.id) {
      await reactionDelegate.delete!({ where: { id: existing.id } } as unknown);
      try { fetch(`http://127.0.0.1:${process.env.WS_PORT ?? 6789}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reaction.removed', reaction: { id: existing.id, messageId, userId, type } }) }); } catch {}
      return NextResponse.json({ removed: true });
    }

    const rec = await reactionDelegate.create!({ data: { messageId, userId, type } } as unknown);
    try { fetch(`http://127.0.0.1:${process.env.WS_PORT ?? 6789}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reaction.created', reaction: rec }) }); } catch {}
    return NextResponse.json({ reaction: rec });
  } catch (e) {
    console.error('POST /api/messages/[id]/reactions error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
