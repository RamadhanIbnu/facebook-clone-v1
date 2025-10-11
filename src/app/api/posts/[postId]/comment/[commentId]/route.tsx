import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../../../lib/session";

export async function DELETE(req: Request, { params }: { params: Promise<{ postId: string; commentId: string }> }) {
  try {
    const p = await params;
    const { postId, commentId } = p;
    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // Attempt atomic delete only if the comment belongs to the user
    const deleted = await prisma.comment.deleteMany({ where: { id: commentId, userId } });
    if (deleted.count === 0) {
      const existing = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // return the post so client can update
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { comments: true, likes: true } });
    return NextResponse.json({ post: { id: post?.id, userId: post?.userId, content: post?.content, image: post?.image, likes: post?.likes.map((l: { userId: string }) => l.userId), comments: post?.comments.map((c: { id: string; userId: string; text: string; createdAt: Date }) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })), createdAt: post?.createdAt } });
  } catch (err) {
    console.error("DELETE /api/posts/[postId]/comment/[commentId] error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
