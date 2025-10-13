import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromCookie } from '../../../../lib/session';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie');
    const viewerId = getUserIdFromCookie(cookie);
    if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // defensive prisma access: follow model may not exist on generated client
    const clientAny = prisma as unknown as { follow?: { findMany?: (q: unknown) => Promise<unknown[]> } };
    if (!clientAny.follow || typeof clientAny.follow.findMany !== 'function') {
      return NextResponse.json({ users: [] });
    }

    // get the list of following ids, then fetch user records
  const recs = (await clientAny.follow.findMany({ where: { followerId: viewerId } } as unknown)) as Array<{ followingId?: string }>;
  const ids = recs.map((r) => (r && r.followingId ? String(r.followingId) : '')).filter(Boolean) as string[];

    // fallback: if no ids, return empty
    if (!ids || ids.length === 0) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, avatar: true } });
    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET /api/profile/following error', err);
    return NextResponse.json({ users: [] });
  }
}
