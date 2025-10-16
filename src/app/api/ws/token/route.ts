import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/session';
import { signToken } from '@/lib/auth';

// Mint a short-lived WS token for the current signed-in user.
export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie');
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // purpose claim restricts token usage to WS auth only
  const token = signToken({ userId, purpose: 'ws' }, { expiresIn: '60s' } as unknown as Record<string, unknown>);
    return NextResponse.json({ token });
  } catch (e) {
    console.error('GET /api/ws/token error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
