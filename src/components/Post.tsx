"use client";
import React, { useState } from "react";
import Image from "next/image";
import { getUserById, type Post } from "../lib/store";

type Props = {
  post: Post;
  currentUserId: string;
  onUpdated: (post: Post) => void;
};

export default function PostItem({ post, currentUserId, onUpdated }: Props) {
  const user = getUserById(post?.userId);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const toggleLike = async () => {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const data = await res.json();
    onUpdated(data.post);
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });
    const data = await res.json();
    setCommentText("");
    onUpdated(data.post);
    setShowComments(true);
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <p className="mt-3 mb-3 whitespace-pre-wrap">{post.content}</p>

          {post.image && (
            <div className="w-full rounded overflow-hidden">
              <Image src={post.image} alt="post" width={800} height={400} className="w-full h-auto" />
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <button onClick={toggleLike} className="hover:underline">
              {post.likes.includes(currentUserId) ? "Unlike" : "Like"} ({post.likes.length})
            </button>
            <button onClick={() => setShowComments((s) => !s)} className="hover:underline">
              Comments ({post.comments.length})
            </button>
          </div>

          {showComments && (
            <div className="mt-3 border-t pt-3 space-y-2">
              {post.comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="font-semibold">{getUserById(c.userId).name}</span>: {c.text}
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 rounded px-2 py-1 bg-gray-100 dark:bg-gray-700"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={addComment}>
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
