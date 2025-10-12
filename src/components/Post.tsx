"use client";
import React, { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import Link from "next/link";
import { useAuthModal } from "../context/AuthModalContext";
import Image from "next/image";
import { getUserById } from "../lib/store";
import type { Post } from "../lib/componentTypes";
import type { UpdatedPost } from "../lib/componentTypes";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faComment as faCommentIcon, faThumbsUp } from '@fortawesome/free-solid-svg-icons';

type CommentDeleteControlsProps = {
  postId: string;
  commentId: string;
  onDeleted: (post: UpdatedPost) => void;
  push: (t: { type: "success" | "error"; message: string }) => void;
};

function CommentDeleteControls({ postId, commentId, onDeleted, push }: CommentDeleteControlsProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const doDelete = async () => {
    // simple auth check
    // we won't have access to currentUserId here, rely on the server response
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment/${commentId}`, { method: "DELETE" });
      let data: unknown = undefined;
      try {
        data = await res.json();
      } catch {
        data = { error: res.ok ? undefined : res.statusText } as unknown;
      }
      const parsed = (data && typeof data === "object") ? (data as { error?: string; post?: unknown }) : { error: undefined };
      if (!res.ok) {
        push({ type: "error", message: parsed.error ?? `Failed to delete comment (${res.status})` });
        return;
      }
  if (parsed.post) onDeleted(parsed.post as UpdatedPost);
      push({ type: "success", message: "Comment deleted" });
    } catch (err) {
      console.error(err);
      push({ type: "error", message: "Server error while deleting comment" });
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
        <div className="inline-flex items-center">
      {!confirming ? (
        <button
          className="inline-flex items-center gap-1 text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded-md border border-red-100 ml-2"
          onClick={() => setConfirming(true)}
          aria-label="Delete comment"
        >
          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
          Delete
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button ref={confirmRef} className="text-xs px-2 py-1 bg-red-600 text-white rounded-md" onClick={doDelete} disabled={loading}>
            {loading ? "Deleting..." : "Confirm"}
          </button>
          <button className="text-xs px-2 py-1 bg-gray-100 rounded-md" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  post: Post;
  currentUserId: string;
  onUpdated: (post: UpdatedPost) => void;
};

export default function PostItem({ post, currentUserId, onUpdated }: Props) {
  const { user: authUser } = useAuth();
  const storeUser = getUserById(post.userId);
  // prefer server-provided user on the post object, fall back to local store
  const author = (post as unknown as { user?: { id: string; name?: string | null; avatar?: string | null } })?.user ?? storeUser;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const authModal = useAuthModal();
  const toggleLike = async () => {
    if (!currentUserId) return authModal.open();
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const data = await res.json();
    onUpdated((data as { post?: UpdatedPost }).post as UpdatedPost);
  };

  const { push } = useToast();
  // post delete UX state
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const confirmPostButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (confirmDeletePost) confirmPostButtonRef.current?.focus();
  }, [confirmDeletePost]);

  const deletePost = async () => {
    if (!currentUserId) return authModal.open();
    setDeletingPost(true);
    // start deleting (local UX handled via confirm state)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      let data: unknown = undefined;
      try {
        data = await res.json();
      } catch {
        data = { error: res.ok ? undefined : res.statusText } as unknown;
      }
      const parsed = (data && typeof data === "object") ? (data as { error?: string; post?: unknown; deleted?: boolean; id?: string }) : { error: undefined };
      if (!res.ok) {
        push({ type: "error", message: parsed.error ?? `Failed to delete post (${res.status})` });
        return;
      }
  onUpdated({ deleted: true, id: post.id });
      push({ type: "success", message: "Post deleted" });
    } catch (err) {
      console.error(err);
      push({ type: "error", message: "Server error while deleting post" });
    } finally {
      setConfirmDeletePost(false);
      setDeletingPost(false);
    }
  };

  const addComment = async () => {
    if (!currentUserId) return authModal.open();
    if (!commentText.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });
    const data = await res.json();
    setCommentText("");
    onUpdated((data as { post?: UpdatedPost }).post as UpdatedPost);
    setShowComments(true);
  };

  return (
    <>
      <article className="fb-card p-4 text-gray-900">
        <div className="flex items-start gap-3">
            <div>
              <Link href={`/profile/${post.userId}`} aria-label={`View ${author.name ?? 'profile'}`}>
                <Avatar
                  name={author.name ?? ''}
                  size={44}
                  src={
                    // prefer server-provided avatar on the post object
                    ((post as unknown as { user?: { avatar?: string } })?.user?.avatar) ??
                    // if this post belongs to the signed-in user, use auth avatar
                    (post.userId === authUser?.id ? (authUser.avatar ?? undefined) : undefined) ??
                    // fallback to local store avatar
                    ((author as unknown as { avatar?: string | null }).avatar ?? undefined)
                  }
                />
              </Link>
            </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/profile/${post.userId}`} className="font-semibold text-gray-900 hover:underline">
                    <div className="font-semibold">{author.name}</div>
                  </Link>
                  <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
                  <Link href={`/profile/${post.userId}`} className="text-xs text-gray-400 hover:underline">{`@${(author.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20)}`}</Link>
                </div>
              {currentUserId === post.userId && (
                <div>
                  {!confirmDeletePost ? (
                    <button
                      className="inline-flex items-center gap-2 text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded-md border border-red-100"
                      onClick={() => setConfirmDeletePost(true)}
                      aria-label="Delete post"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 opacity-80" />
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        ref={confirmPostButtonRef}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                        onClick={deletePost}
                        disabled={deletingPost}
                        aria-label="Confirm delete post"
                      >
                        {deletingPost ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            Confirm
                          </>
                        )}
                      </button>
                      <button
                        className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 border border-gray-200"
                        onClick={() => setConfirmDeletePost(false)}
                        disabled={deletingPost}
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 mb-3 whitespace-pre-wrap">{post.content}</p>

            {post.image && (
              <div className="w-full rounded overflow-hidden">
                <Image src={post.image} alt="post" width={800} height={400} className="w-full h-auto rounded" />
              </div>
            )}

            <div className="mt-3 border-t pt-3">
              <div className="flex justify-between text-sm text-gray-600">
                <div className="flex gap-4">
                  <button onClick={toggleLike} className={`flex items-center gap-2 px-3 py-1 rounded ${post.likes.includes(currentUserId) ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100'}`}>
                    <FontAwesomeIcon icon={faThumbsUp} className={`w-4 h-4 ${post.likes.includes(currentUserId) ? 'text-red-600' : 'text-current'}`} />
                    <span>{post.likes.length}</span>
                  </button>
                  <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded">
                    <FontAwesomeIcon icon={faCommentIcon} className="w-4 h-4" />
                    <span>{post.comments.length}</span>
                  </button>
                </div>
              </div>

              {showComments && (
                <div className="mt-3 space-y-2">
                  {post.comments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <div>
                            <Link href={`/profile/${c.userId}`}>
                                <Avatar
                                  name={((c as unknown as { user?: { name?: string } })?.user?.name) ?? (c.userId === authUser?.id ? authUser?.name : getUserById(c.userId).name)}
                                size={28}
                                src={
                                  // prefer server-provided avatar on the comment object
                                    ((c as unknown as { user?: { avatar?: string } })?.user?.avatar) ??
                                    (c.userId === authUser?.id ? (authUser.avatar ?? undefined) : undefined) ??
                                    // fallback to local store avatar
                                    ((getUserById(c.userId) as unknown as { avatar?: string | null }).avatar ?? undefined)
                                }
                              />
                            </Link>
                          </div>
                          <div>
                              <div className="text-sm">
                              <Link href={`/profile/${c.userId}`} className="font-semibold hover:underline">{((c as unknown as { user?: { name?: string } })?.user?.name) ?? (c.userId === authUser?.id ? authUser?.name : getUserById(c.userId).name)}</Link>
                              <Link href={`/profile/${c.userId}`} className="text-xs text-gray-400 ml-2 hover:underline">{`@${((((c as unknown as { user?: { name?: string } })?.user?.name) ?? (c.userId === authUser?.id ? authUser?.name : getUserById(c.userId).name)) ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0,20)}`}</Link>
                            </div>
                            <div className="text-sm">{c.text}</div>
                          </div>
                        </div>
                        {currentUserId === c.userId && (
                          <div>
                            <CommentDeleteControls
                              postId={post.id}
                              commentId={c.id}
                              onDeleted={(updatedPost) => onUpdated(updatedPost)}
                              push={push}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 rounded px-2 py-1 bg-gray-100"
                      placeholder={currentUserId ? "Write a comment..." : "Sign in to comment"}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={!currentUserId}
                    />
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={addComment} disabled={!currentUserId}>
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
