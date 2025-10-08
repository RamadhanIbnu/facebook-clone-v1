"use client";
import React, { useEffect, useState } from "react";
import NewPost from "./NewPost";
import PostItem from "./Post";
import type { Post } from "../lib/store";

export default function Feed({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreated = (post: Post) => setPosts((s) => [post, ...s]);

  const handleUpdate = (updated: Post) => setPosts((s) => s.map((p) => (p?.id === updated?.id ? updated : p)));

  return (
    <div className="space-y-4">
      <NewPost currentUserId={currentUserId} onCreated={handleCreated} />

      {loading && <div className="p-4">Loading...</div>}

      {posts.map((p) => (
        <PostItem key={p?.id} post={p} currentUserId={currentUserId} onUpdated={handleUpdate} />
      ))}
    </div>
  );
}
