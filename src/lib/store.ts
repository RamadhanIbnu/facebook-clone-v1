import type { User as UserType } from "./componentTypes/UserTypes";
import type { Comment as CommentType } from "./componentTypes/CommentTypes";
import type { Post as PostType } from "./componentTypes/PostTypes";

export type User = UserType;
export type Comment = CommentType;
export type Post = PostType;

const users: Record<string, User> = {
  u1: { id: "u1", name: "Alex Johnson", title: "Software Engineer" },
  u2: { id: "u2", name: "Samira Lee", title: "Product Designer" },
  u3: { id: "u3", name: "Diego Ramos", title: "Photographer" },
};

const now = () => new Date().toISOString();

const posts: Record<string, Post> = {
  p1: {
    id: "p1",
    userId: "u2",
    content: "Excited to share the new project I'm working on!",
    likes: ["u1"],
    comments: [
      { id: "c1", userId: "u1", text: "Looks great!", createdAt: now() },
    ],
    createdAt: now(),
  },
  p2: {
    id: "p2",
    userId: "u3",
    content: "Golden hour shots from last weekend.",
    image: "/file.svg",
    likes: [],
    comments: [],
    createdAt: now(),
  },
};

export function getUserById(id: string): User {
  return users[id] ?? { id: "unknown", name: "Unknown" } as User;
}

export function listPosts(): Post[] {
  return Object.values(posts).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createPost(userId: string, content: string, image?: string): Post {
  const id = `p${Math.random().toString(36).slice(2, 9)}`;
  const post: Post = { id, userId, content, image, likes: [], comments: [], createdAt: now() };
  posts[id] = post;
  return post;
}

export function toggleLike(postId: string, userId: string): Post | null {
  const post = posts[postId];
  if (!post) return null;
  const idx = post.likes.indexOf(userId);
  if (idx === -1) post.likes.push(userId);
  else post.likes.splice(idx, 1);
  return post;
}

export function addComment(postId: string, userId: string, text: string): Comment | null {
  const post = posts[postId];
  if (!post) return null;
  const comment: Comment = { id: `c${Math.random().toString(36).slice(2, 9)}`, userId, text, createdAt: now() };
  post.comments.push(comment);
  return comment;
}
