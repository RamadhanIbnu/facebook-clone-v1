Deployment checklist — facebook-clone-v1

This file documents the recommended steps to deploy the app to Vercel with Prisma + Postgres.

1. Provision a managed Postgres database

   - Examples: Supabase, Neon, PlanetScale (MySQL-compatible), Railway
   - Copy the connection string (Postgres) for the database.

2. Configure Vercel environment variables

   - In the Vercel dashboard: Project → Settings → Environment Variables
   - Add the following keys and values (set to the appropriate environment: Production, Preview):
     - DATABASE_URL = postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true
       (pooled connection URL for runtime)
     - DIRECT_URL = postgresql://USER:PASSWORD@HOST:5432/DATABASE
       (direct DB connection; used for migrations)
     - JWT_SECRET = <a long random secret, 32+ bytes recommended>
     - NEXT_PUBLIC_WS_URL = wss://your-ws-server.example (optional)

   Notes:

   - Use the pooled URL (pgbouncer=true) for DATABASE_URL to limit connections from serverless instances.
   - DIRECT_URL should point at the direct DB port (5432) and is used only by migration commands.

3. Ensure Prisma client is generated during build and migrations are applied

   - We updated package.json to include a vercel-build script that runs:
     prisma generate && prisma migrate deploy && next build
   - Vercel will run `postinstall` and then `vercel-build` during the build pipeline.

4. Run migrations (local or CI)
   - Optionally run migrations from your machine (make sure your local .env points to the managed DB temporarily):

```powershell
# generate client
npx prisma generate

# deploy migrations to the remote DB
npx prisma migrate deploy
```

- If you prefer to apply migrations as part of the Vercel build, the `prisma migrate deploy` command in `vercel-build` will do that. Note: ensure DIRECT_URL is available to the build environment (set it in Vercel env variables).

5. Redeploy on Vercel

   - After setting env vars, trigger a redeploy in Vercel (push to your repo or use the Vercel UI to redeploy).

6. Verify runtime

   - Visit /api/\_debug/runtime to confirm:
     - dbOk: true
     - hasJwt: true
     - jwtWorks: true

7. Rollback plan
   - If the deployment fails, rollback in Vercel to the previous successful deployment and inspect deploy logs.

Security reminders

- Never commit real secrets to the repo. Use Vercel's Environment Variables for production credentials.
- Rotate JWT_SECRET if it was accidentally committed or exposed.

Troubleshooting

- If Prisma migration fails in the Vercel build due to network issues, run `npx prisma migrate deploy` locally (pointing to the remote DB) and rerun the deploy.
- For connection pooling issues, confirm your provider supports PgBouncer and that you're using the pooled port in DATABASE_URL.
