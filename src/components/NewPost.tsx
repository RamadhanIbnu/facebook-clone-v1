"use client";
import React, { useState } from "react";
import { useAuthModal } from "../context/AuthModalContext";
import type { Post } from "../lib/componentTypes";

type Props = {
  currentUserId: string;
  onCreated: (post: Post) => void;
};

export default function NewPost({ currentUserId, onCreated }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const authModal = useAuthModal();
  if (!currentUserId) {
    return (
      <div className="fb-card p-4 text-center">
        <div className="mb-2">Please <button onClick={() => authModal.open()} className="text-blue-600">sign in</button> to create a post.</div>
      </div>
    );
  }

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    let data: unknown = null;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    }
    setText("");
    setLoading(false);
    const isPost = (v: unknown): v is { post: Post } => typeof v === 'object' && v !== null && 'post' in (v as object);
    if (isPost(data)) onCreated(data.post);
  };

  return (
  <div className="fb-card p-4 text-gray-900">
      <div className="flex items-start gap-3">
        <div>
          <div className="w-10 h-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex-1">
          <textarea
            rows={3}
            className="w-full rounded-xl p-3 bg-gray-100 text-sm resize-none placeholder-gray-600"
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button className="px-3 py-1 rounded hover:bg-gray-100 flex items-center gap-2">📷 <span className="hidden sm:inline">Photo</span></button>
              <button className="px-3 py-1 rounded hover:bg-gray-100 flex items-center gap-2">🎥 <span className="hidden sm:inline">Live</span></button>
            </div>
            <div>
              <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-full">
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
