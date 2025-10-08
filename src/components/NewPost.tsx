"use client";
import React, { useState } from "react";
import type { Post } from "../lib/store";

type Props = {
  currentUserId: string;
  onCreated: (post: Post) => void;
};

export default function NewPost({ currentUserId, onCreated }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, content: text }),
    });
    const data = await res.json();
    setText("");
    setLoading(false);
    onCreated(data.post as Post);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow-sm p-4">
      <textarea
        rows={3}
        className="w-full rounded p-2 bg-gray-100 dark:bg-gray-700 text-sm"
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-3 flex justify-end">
        <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
