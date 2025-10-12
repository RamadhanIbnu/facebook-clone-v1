import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../../lib/session";

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
  const params = await context.params;
  const { userId } = params;
  const cookie = req.headers.get("cookie");
  const followerId = getUserIdFromCookie(cookie);
  if (!followerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (followerId === userId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const follow = await (prisma as any).follow.create({ data: { followerId, followingId: userId } });
    // return updated counts so client can reconcile
    const clientAny = prisma as unknown as { follow?: { count: (q: unknown) => Promise<number>; findFirst: (q: unknown) => Promise<unknown> } };
    let followersCount = 0;
    let isFollowing = false;
    if (clientAny.follow) {
      followersCount = await clientAny.follow.count({ where: { followingId: userId } });
      isFollowing = !!(await clientAny.follow.findFirst({ where: { followerId, followingId: userId } }));
    }
    return NextResponse.json({ success: true, followId: follow.id, followersCount, isFollowing });
  } catch {
    return NextResponse.json({ error: "Already following or invalid" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ userId: string }> }) {
  const params = await context.params;
  const { userId } = params;
  const cookie = req.headers.get("cookie");
  const followerId = getUserIdFromCookie(cookie);
  if (!followerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const clientAny = prisma as unknown as { follow?: { deleteMany: (q: unknown) => Promise<unknown>; count: (q: unknown) => Promise<number> } };
    if (clientAny.follow) {
      await clientAny.follow.deleteMany({ where: { followerId, followingId: userId } });
  const followersCount = await clientAny.follow.count({ where: { followingId: userId } });
  const isFollowing = false;
  return NextResponse.json({ success: true, followersCount, isFollowing });
    }
    // fallback when generated client not available
    return NextResponse.json({ success: true, followersCount: 0, isFollowing: false });
    
  } catch {
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
  }
}
