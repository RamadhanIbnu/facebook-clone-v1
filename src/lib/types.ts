import type { Post } from "./store";

export type UpdatedPost = Post | { deleted: true; id: string };
