# Facebook Clone v1

A lightweight Facebook-like clone built with Next.js (App Router), TypeScript, Tailwind CSS and Prisma (SQLite). Intended as a demo/prototype to explore social features like posts, comments, likes, follow/unfollow, profiles, and avatar uploads.

This repository is a learning / demo project and not production-ready. It focuses on clear code, local development, and straightforward server-side authorization patterns.

## Features

- Email/password credentials auth with cookie-based sessions
- Create, read, update, delete (CRUD) posts
- Comments on posts with delete permissions enforced
- Like/unlike posts
- Follow / unfollow users with follower counts
- Profile pages with posts and a composer
- Avatar upload (file upload to local storage via API)
- Server-side ownership checks for delete endpoints
- Small test scripts to exercise auth/authorization flows

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS for UI
- Prisma ORM with SQLite

## Getting started

Prerequisites:

- Node.js 18+ (recommended)
- npm (or yarn)

Install dependencies:

```powershell
npm install
```

Run the development server:

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

Run TypeScript checks:

```powershell
npx tsc --noEmit
```

## Database

This project uses Prisma with SQLite. The database file is located under `prisma/dev.db` (or where your `prisma.schema` config points).

If you modify the Prisma schema, run:

```powershell
npx prisma generate
npx prisma migrate dev --name "your-migration-name"
```

## Important files & folders

- `src/app/` - Next.js App Router pages and API routes
  - `src/app/api/posts/route.tsx` - Posts API (GET/POST) — POST now uses session cookie as the authoritative user and returns `user` metadata on create.
  - `src/app/api/profile/[userId]/route.ts` - Profile API returning user, posts (with user and comments metadata), followersCount and isFollowing
  - `src/app/api/posts/[postId]/route.tsx` - Post-level operations (DELETE with server-side ownership checks)
- `src/components/` - Reusable React components (Post, NewPost, Avatar, Header, etc.)
- `src/context/` - Auth, Toast, and modal contexts used across the app
- `scripts/` - Small Node scripts used for manual integration tests (auth/delete flows). These are utilities, not part of the production app.

## Test scripts

There are a few scripts under `scripts/` intended for dev/test use:

- `scripts/delete-auth-test.js` - manual cookie merging version
- `scripts/delete-auth-test-cookie.mjs` - ESM cookie-jar version using `tough-cookie`
- `scripts/delete-auth-test-cookie.js` - CommonJS cookie-jar version (may require node options)

Usage example (Node):

```powershell
node scripts/delete-auth-test.js
node --experimental-modules scripts/delete-auth-test-cookie.mjs
```

## Security notes

- Server-side routes validate ownership for mutating operations (deletes) using atomic queries.
- POST /api/posts ignores client-supplied `userId` and derives the author from the session cookie to prevent impersonation.

## Contributing

This project is a demo. If you'd like to propose changes, open an issue or submit a PR with a clear description.

## License

MIT
