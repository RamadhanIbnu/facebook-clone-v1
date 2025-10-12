"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../context/AuthModalContext";
// programmatic routing not currently required in this file
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "../../../components/Avatar";
import PostItem from "../../../components/Post";
import NewPost from "../../../components/NewPost";
import Header from "../../../components/Header";
import ProfileImageModal from "../../../components/ProfileImageModal";
import { useToast } from "../../../context/ToastContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheck, faUser, faChevronDown, faPen } from '@fortawesome/free-solid-svg-icons';

import type { PostPublic, UserPublic } from "../../../lib/componentTypes";
type PostPublicWithUser = PostPublic & { user?: { id: string; name?: string | null; avatar?: string | null } };
import type { UpdatedPost, Post } from "../../../lib/componentTypes/PostTypes";
import type { Comment } from "../../../lib/componentTypes/CommentTypes";
type PostWithUser = Post & { user?: { id: string; name?: string | null; avatar?: string | null } };

function FollowButton({ userId, initialFollowing, initialCount, onCountChange }: { userId: string; initialFollowing?: boolean; initialCount?: number | null; onCountChange?: (n: number) => void }) {
  const auth = useAuth();
  const authModal = useAuthModal();
  const [following, setFollowing] = React.useState<boolean>(!!initialFollowing);
  const [count, setCount] = React.useState<number>(initialCount ?? 0);
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const followUser = async () => {
    if (!auth.user) return authModal.open('signin');
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}/follow`, { method: 'POST' });
      let json: unknown = null;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        try { json = await res.json(); } catch { json = null; }
      }
      if (!res.ok) {
        let errMsg = 'Failed to follow';
        if (json && typeof json === 'object' && 'error' in json) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errMsg = (json as any).error || errMsg;
        }
        throw new Error(errMsg);
      }
      if (json && typeof json === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const j = json as any;
        if (typeof j.isFollowing === 'boolean') setFollowing(j.isFollowing);
        if (typeof j.followersCount === 'number') {
          setCount(j.followersCount);
          onCountChange?.(j.followersCount);
        }
      } else {
        setFollowing(true);
        const newCount = count + 1;
        setCount(newCount);
        onCountChange?.(newCount);
      }
      push({ type: 'success', message: 'Following' });
    } catch (err) {
      console.error(err);
      push({ type: 'error', message: (err as Error).message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!auth.user) return authModal.open('signin');
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}/follow`, { method: 'DELETE' });
      let json: unknown = null;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        try { json = await res.json(); } catch { json = null; }
      }
      if (!res.ok) {
        let errMsg = 'Failed to unfollow';
        if (json && typeof json === 'object' && 'error' in json) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errMsg = (json as any).error || errMsg;
        }
        throw new Error(errMsg);
      }
      if (json && typeof json === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const j = json as any;
        if (typeof j.isFollowing === 'boolean') setFollowing(j.isFollowing);
        if (typeof j.followersCount === 'number') {
          setCount(j.followersCount);
          onCountChange?.(j.followersCount);
        }
      } else {
        setFollowing(false);
        const newCount = Math.max(0, count - 1);
        setCount(newCount);
        onCountChange?.(newCount);
      }
      push({ type: 'success', message: 'Unfollowed' });
    } catch (err) {
      console.error(err);
      push({ type: 'error', message: (err as Error).message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (following) await unfollowUser(); else await followUser();
  };

  // close dropdown when clicking outside or pressing Escape
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 relative">
          <div className="inline-flex items-center rounded-md bg-transparent">
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          aria-pressed={following}
          title={following ? 'Unfollow' : 'Follow'}
          aria-label={following ? 'Unfollow' : 'Follow'}
          className={`px-3 sm:px-4 py-2 rounded-l-md text-sm font-medium flex items-center gap-2 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed ${following ? 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-current" />
          ) : following ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-current" />
              <span className="hidden sm:inline">Following</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-current" />
              <span className="hidden sm:inline">Follow</span>
            </>
          )}
        </button>

        {following && (
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((s) => !s)}
            className={`px-2 py-2 rounded-r-md border ${loading ? 'opacity-50 pointer-events-none' : 'bg-white border-gray-200 hover:bg-gray-50'} focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-200`}
            aria-label="More follow actions"
            title="More follow actions"
          >
            <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* follower count shown in the profile info card; keep FollowButton focused on the action */}

      {menuOpen && (
        <div ref={menuRef} role="menu" aria-label="Follow actions" className="absolute right-0 mt-12 w-44 bg-white rounded shadow-lg z-50">
          <div className="py-1">
            <button role="menuitem" onClick={() => { setMenuOpen(false); router.push(`/messages/${userId}`); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Message</button>
            <button role="menuitem" onClick={async () => { setMenuOpen(false); await unfollowUser(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Unfollow</button>
          </div>
        </div>
      )}
    </div>
  );
}


function Breadcrumb({ name }: { name: string }) {
  return (
    <nav className="text-sm text-gray-600 mb-3" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:underline text-gray-700">Home</Link>
        </li>
        <li className="text-gray-400">/</li>
        <li>
          <Link href="/users" className="hover:underline text-gray-700">Users</Link>
        </li>
        <li className="text-gray-400">/</li>
        <li aria-current="page" className="text-gray-900 font-medium">{name}</li>
      </ol>
    </nav>
  );
}

export default function ProfilePage() {
  const params = useParams() as { userId?: string } | null;
  const userId = params?.userId;
  const [data, setData] = useState<{ user: UserPublic; posts: PostPublic[]; isFollowing?: boolean; followersCount?: number; followingCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { refresh } = useAuth();
  const { push } = useToast();
  const { user: authUser } = useAuth();
  // router was previously used for programmatic navigation; BackButton now uses Link

  

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
  let json: unknown = null;
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          try {
            json = await res.json();
          } catch {
            // not valid JSON
            json = null;
          }
        }
        if (!mounted) return;
        if (!res.ok) {
          // if the server returned an error status, show a toast and bail
          let parsedError: string | undefined;
          if (json && typeof json === "object" && json !== null && "error" in json) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsedError = (json as any).error;
          }
          push({ type: "error", message: parsedError || `Failed to load profile (${res.status})` });
          setData(null);
          return;
        }
        if (!json) {
          push({ type: "error", message: "Unexpected server response while loading profile" });
          setData(null);
          return;
        }
        if (typeof json === "object" && json !== null && "user" in json && "posts" in json) {
          const parsed = json as { user: UserPublic; posts: PostPublic[]; isFollowing?: boolean; followersCount?: number; followingCount?: number };
          setData(parsed);
        } else {
          push({ type: "error", message: "Unexpected server response while loading profile" });
          setData(null);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        push({ type: "error", message: "Network error while loading profile" });
        setData(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, push]);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    // defensively parse JSON: the server should return JSON, but sometimes platform errors
    // or network issues result in empty/non-JSON responses which cause res.json() to throw.
  let json: Record<string, unknown> | null = null;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try { json = await res.json(); } catch { json = null; }
    }
    setLoading(false);
    if (res.ok) {
      // update local UI immediately
      const avatar = json && typeof json.avatar === 'string' ? json.avatar : undefined;
      setData((d) => (d ? { ...d, user: { ...d.user, avatar: avatar ?? d.user.avatar } } : d));
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      // refresh global auth state (avatar)
      await refresh();
      push({ type: 'success', message: 'Profile picture updated' });
    } else {
      const errMsg = json && typeof (json as Record<string, unknown>).error === 'string' ? (json as Record<string, unknown>).error as string : 'Upload failed';
      push({ type: 'error', message: errMsg });
    }
  };

  if (!data)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-40 bg-gray-100 animate-pulse rounded" />
        <div className="-mt-12 flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="h-24 bg-white rounded shadow-sm animate-pulse" />
          <div className="h-24 bg-white rounded shadow-sm animate-pulse" />
        </div>
      </div>
    );

  const { user, posts } = data;

  // generate a simple username handle from the display name
  const makeHandle = (name?: string | null) => {
    if (!name) return '';
    return '@' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
  };

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
      {/* cover */}
      <div className="relative">
        <div className="h-40 w-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-t-md shadow-sm overflow-hidden" />
          {/* header overlay (FB-like) */}
          <div className="absolute inset-x-0 top-3 flex items-center px-4">
            <div className="flex-1" />

            {/* intentionally empty — name will appear beside the avatar below for a Facebook-like layout */}
            <div className="flex-1 hidden md:block" />

            <div className="flex-1 flex justify-end items-center gap-2">
              {/* buttons moved to the username row for both desktop and mobile */}
              <div className="hidden md:block" />
            </div>
          </div>
      </div>

      {/* avatar + name */}
      <div className="-mt-16">
        <Breadcrumb name={user.name} />
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0 -mt-8">
            <button onClick={() => setModalOpen(true)} className="w-36 h-36 rounded-full ring-4 ring-white bg-white overflow-hidden shadow-lg p-0 border-0 cursor-pointer hover:scale-105 transform transition">
              <Avatar name={user.name} src={user.avatar} size={144} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              
              {/* name block: username left, actions right on same row for md+ */}
              <div className="hidden md:flex items-center justify-between w-full">
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold text-gray-900 truncate">{user.name}</h1>
                  <div className="text-sm text-gray-500 truncate">{user.title}</div>
                  {user.name && (
                    <div className="text-sm text-gray-400 mt-1">{makeHandle(user.name)}</div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {authUser && String(authUser.id) !== String(user.id) && (
                    <FollowButton userId={user.id} initialFollowing={data?.isFollowing} initialCount={data?.followersCount} onCountChange={(n) => setData((d) => (d ? { ...d, followersCount: n } : d))} />
                  )}
                  {authUser && String(authUser.id) === String(user.id) && (
                    <button className="px-2 py-1 bg-white text-gray-800 border border-gray-200 rounded text-sm hover:bg-gray-50 transition flex items-center gap-2" onClick={() => alert('Edit profile not implemented')}>
                      <FontAwesomeIcon icon={faPen} className="w-4 h-4 sm:hidden" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="truncate md:hidden">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 truncate">{user.name}</h1>
                    <div className="text-sm text-gray-500 truncate">{user.title}</div>
                    {user.name && (
                      <div className="text-sm text-gray-400 mt-1">{makeHandle(user.name)}</div>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {authUser && String(authUser.id) !== String(user.id) && (
                      <FollowButton userId={user.id} initialFollowing={data?.isFollowing} initialCount={data?.followersCount} onCountChange={(n) => setData((d) => (d ? { ...d, followersCount: n } : d))} />
                    )}
                    {authUser && String(authUser.id) === String(user.id) && (
                      <button className="px-2 py-1 bg-white text-gray-800 border border-gray-200 rounded text-sm hover:bg-gray-50 transition flex items-center gap-2" onClick={() => alert('Edit profile not implemented')}>
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* follow button moved to header overlay */}
            </div>
          </div>
        </div>
      </div>

      <ProfileImageModal
        src={user.avatar ?? undefined}
        open={modalOpen}
        onClose={() => { setModalOpen(false); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setFile(null); } }}
        onFileSelected={(f) => { setFile(f); if (f) { const url = URL.createObjectURL(f); setPreviewUrl(url); } else { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }}
        onUpload={async () => { await upload(); setModalOpen(false); }}
        previewUrl={previewUrl}
        loading={loading}
      />

      {/* stats + posts */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="p-4 bg-white rounded shadow-sm space-y-3">
            <div className="text-sm text-gray-500">Profile info</div>
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.title || 'No title set'}</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-semibold">{posts.length}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{typeof data?.followersCount === 'number' ? data?.followersCount : 0}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{typeof data?.followingCount === 'number' ? data?.followingCount : 0}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-4">
            {/* Composer above posts (Facebook-like) */}
            {authUser?.id === user?.id && (
                <NewPost currentUserId={authUser?.id ?? ""} onCreated={(created) => {
              const createdAny = created as unknown as PostPublic;
              const postWithUser: PostPublicWithUser = {
                ...createdAny,
                user: createdAny.userId === user.id ? { id: user.id, name: user.name, avatar: user.avatar ?? null } : undefined,
              };
              setData((d) => d ? { ...d, posts: [postWithUser, ...d.posts] } : d);
            }} />
            )}
            {posts.length === 0 && (
              <div className="p-6 bg-white rounded shadow-sm text-center text-gray-600">This user hasn&apos;t posted yet.</div>
            )}
            {posts.map((p) => {
              const pub = p as PostPublic;
              const enriched: Post = {
                id: pub.id,
                userId: pub.userId,
                content: pub.content,
                createdAt: pub.createdAt,
                likes: (pub as unknown as { likes?: string[] }).likes ?? [],
                comments: (pub as unknown as { comments?: Comment[] }).comments ?? ([] as Comment[]),
              };
              const pubAny = pub as unknown as { user?: { id: string; name?: string | null; avatar?: string | null } };
              const userMeta = pubAny.user ?? (pub.userId === user.id ? { id: user.id, name: user.name, avatar: user.avatar ?? undefined } : undefined);
              const enrichedWithUser: PostWithUser = { ...enriched, user: userMeta };

              return (
                <div key={p.id}>
                  <PostItem
                    post={enrichedWithUser}
                    currentUserId={authUser?.id ?? ""}
                    onUpdated={(updated: UpdatedPost) => {
                      // handle deletion
                      if ((updated as UpdatedPost).hasOwnProperty("deleted")) {
                        setData((d) => (d ? { ...d, posts: d.posts.filter((x) => x.id !== p.id) } : d));
                        return;
                      }
                      // otherwise replace post in array
                      setData((d) => {
                        if (!d) return d;
                        return { ...d, posts: d.posts.map((x) => (x.id === updated.id ? (updated as unknown as PostPublic) : x)) };
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
