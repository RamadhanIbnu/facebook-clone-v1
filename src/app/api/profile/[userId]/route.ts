import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../lib/session";

type UserPublic = { id: string; name: string; email: string | null; title: string | null; avatar: string | null };

export async function GET(req: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const params = await context.params;
    const { userId } = params;
    const userRec = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRec) return NextResponse.json({ user: null }, { status: 404 });
    const user = userRec as unknown as UserPublic;
  const posts = await prisma.post.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { comments: { include: { user: true } }, likes: true, user: true } });
    const cookie = req.headers.get("cookie");
    const viewerId = getUserIdFromCookie(cookie);

    // followers may reference a newly added Prisma model. If the client wasn't regenerated
    // (for example on Windows when prisma generate failed), accessing prisma.follow can throw.
    // Guard against that and return safe defaults on error.
    let followersCount = 0;
    let isFollowing = false;
    try {
      // The generated Prisma client may not include `follow` if `npx prisma generate` has not been
      // run after adding the model (Windows can lock the binary). At runtime we must guard for
      // that and default to safe values. The following ts-expect-error documents that situation.
      // access follow via any-cast so TypeScript doesn't fail if prisma client wasn't regenerated
  const clientAny = prisma as unknown as { follow?: { count: (args: unknown) => Promise<number>; findFirst: (args: unknown) => Promise<unknown> } };
      if (clientAny.follow) {
        followersCount = await clientAny.follow.count({ where: { followingId: userId } });
        if (viewerId) {
          const found = await clientAny.follow.findFirst({ where: { followerId: viewerId, followingId: userId } });
          isFollowing = !!found;
        }
      } else {
        // client doesn't expose follow model yet (prisma generate may not have been run)
        followersCount = 0;
        isFollowing = false;
      }
    } catch (err) {
      // Log and continue with defaults. This prevents a missing Prisma client model or DB error
      // from causing a 500 that breaks the whole profile page.
      console.error("Could not load follow info for profile:", err);
      followersCount = 0;
      isFollowing = false;
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, title: user.title, avatar: user.avatar },
      posts: posts.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user ? { id: p.user.id, name: p.user.name, avatar: p.user.avatar } : null,
        content: p.content,
        image: p.image,
        likes: p.likes.map((l) => l.userId),
  comments: p.comments.map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt, user: c.user ? { id: c.user.id, name: c.user.name, avatar: c.user.avatar } : null })),
        createdAt: p.createdAt,
      })),
      followersCount,
      isFollowing,
    });
  } catch (err) {
    // Unexpected error - log and return 500 with a small JSON payload to make the client handling safe.
  console.error("Error in GET /api/profile/[userId]:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
