import type { Comment } from "./CommentTypes";

export type Post = {
  id: string;
  userId: string;
  content: string;
  image?: string;
  likes: string[]; // user IDs
  comments: Comment[];
  createdAt: string;
};

export type UpdatedPost = Post | { deleted: true; id: string };
