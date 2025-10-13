-- Migration: initial Postgres schema (generated manually)

CREATE TABLE "User" (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  password TEXT,
  title TEXT,
  avatar TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "Post" (
  id TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Comment" (
  id TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Like" (
  id TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Follow" (
  id TEXT NOT NULL PRIMARY KEY,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "Follow_follower_fkey" FOREIGN KEY ("followerId") REFERENCES "User" (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Follow_following_fkey" FOREIGN KEY ("followingId") REFERENCES "User" (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"(email);
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like"("postId","userId");
CREATE UNIQUE INDEX "Follow_follower_following_key" ON "Follow"("followerId","followingId");
