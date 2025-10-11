import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../lib/session";

export async function DELETE(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const p = await params;
    const { postId } = p;
    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // Try to delete the post where id matches and owner is the authenticated user.
    // This avoids a race where the post ownership could change between a find and delete.
    const deleted = await prisma.post.deleteMany({ where: { id: postId, userId } });
    if (deleted.count === 0) {
      // determine if the post existed at all
      const existing = await prisma.post.findUnique({ where: { id: postId } });
      if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ deleted: true, id: postId });
  } catch (err) {
    console.error("DELETE /api/posts/[postId] error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
