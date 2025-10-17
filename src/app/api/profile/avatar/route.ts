import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserIdFromCookie } from "../../../../lib/session";
import supabaseAdmin from "../../../../lib/supabase";
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    const userId = getUserIdFromCookie(cookie);
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "file required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured (missing env vars)');
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const bucket = 'avatars';
    const filename = `${userId}/avatar_${Date.now()}.png`;
    let { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filename, bytes, {
      contentType: (file as Blob).type || 'application/octet-stream',
      upsert: true,
    });
    // If the bucket does not exist, attempt to create it (public) and retry once.
    if (uploadErr) {
      console.warn('Supabase upload error, attempting bucket create if missing:', uploadErr);
      try {
        // createBucket will fail if bucket already exists; ignore errors
        const createRes = await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch((e) => ({ error: e }));
        if (createRes && 'error' in createRes && createRes.error) {
          const ce = createRes.error;
          console.warn('createBucket warning/error:', ce instanceof Error ? ce.message : String(ce));
        } else {
          console.log('Created bucket', bucket);
        }
        // retry upload once
        const retry = await supabaseAdmin.storage.from(bucket).upload(filename, bytes, {
          contentType: (file as Blob).type || 'application/octet-stream',
          upsert: true,
        });
        uploadErr = retry.error;
      } catch (e) {
        const emsg = e instanceof Error ? e.message : String(e);
        console.error('Error while attempting to create bucket and retry upload:', emsg);
        uploadErr = ({ message: emsg } as unknown) as typeof uploadErr;
      }
    }
    if (uploadErr) {
      console.error('Supabase upload error after retry:', uploadErr);
      if (process.env.NODE_ENV !== 'production') {
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', userId);
          await fs.mkdir(uploadDir, { recursive: true });
          const localFilename = `avatar_${Date.now()}.png`;
          const localPath = path.join(uploadDir, localFilename);
          await fs.writeFile(localPath, bytes);
          const publicPathLocal = `/uploads/${userId}/${localFilename}`;
          await prisma.user.update({ where: { id: userId }, data: { avatar: publicPathLocal } });

          // attempt to delete previous avatar if it was a local upload
          try {
            if (existing && existing.avatar && existing.avatar.startsWith('/uploads/')) {
              const prevPath = path.join(process.cwd(), 'public', existing.avatar.replace(/^\//, ''));
              await fs.unlink(prevPath).catch(() => {});
            }
          } catch (e) {
            console.warn('Failed deleting previous local avatar', e instanceof Error ? e.message : String(e));
          }

          return NextResponse.json({ avatar: publicPathLocal });
        } catch (e) {
          console.error('Local fallback failed:', e instanceof Error ? e.stack ?? e.message : String(e));
          return NextResponse.json({ error: 'Upload failed (local fallback failed)' }, { status: 500 });
        }
      }

      console.error('Supabase upload failed and local fallback disabled in production. uploadErr:', uploadErr);
      return NextResponse.json({ error: 'Upload failed (storage error)' }, { status: 500 });
    }

    const publicUrlData = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
    const publicPath = publicUrlData.data.publicUrl;

    await prisma.user.update({ where: { id: userId }, data: { avatar: publicPath } });

    try {
      if (existing && existing.avatar) {
        const u = new URL(existing.avatar);
        const parts = u.pathname.split('/');
        const idx = parts.indexOf('public');
        if (idx !== -1 && parts.length > idx + 2) {
          // object path is everything after /public/<bucket>/
          const objPath = parts.slice(idx + 2).join('/');
          const bucketName = parts[idx + 1];
          if (bucketName === bucket) {
            const { error: delErr } = await supabaseAdmin.storage.from(bucket).remove([objPath]);
            if (delErr) console.warn('Failed to delete previous avatar:', delErr);
          }
        }
      }
    } catch (delErr) {
      console.warn('Error while attempting to delete previous avatar:', delErr instanceof Error ? delErr.message : String(delErr));
    }

    return NextResponse.json({ avatar: publicPath });
  } catch (err) {
    const out = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error("Error in /api/profile/avatar POST:", out);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
