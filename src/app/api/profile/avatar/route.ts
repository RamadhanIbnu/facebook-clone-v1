import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../lib/session";
import path from "path";
import { promises as fs } from "fs";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie");
  const userId = getUserIdFromCookie(cookie);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "file required" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `avatar_${userId}_${Date.now()}.png`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, bytes);
  const publicPath = `/uploads/${filename}`;
  await prisma.user.update({ where: { id: userId }, data: { avatar: publicPath } });
  return NextResponse.json({ avatar: publicPath });
}
