Migrations history removed from the repository.

This repository previously contained SQLite migrations. We've removed them so you can create a fresh migration history for PostgreSQL.

Next steps (run locally):

1. Ensure your local environment points to the managed Postgres DB (DIRECT_URL / DATABASE_URL). For example (PowerShell):

$env:DATABASE_URL = 'postgresql://postgres:ENCODED_PW@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
$env:DIRECT_URL = 'postgresql://postgres:ENCODED_PW@aws-1-us-east-2.pooler.supabase.com:5432/postgres'

2. Create an initial migration and apply it to PostgreSQL:

npx prisma migrate dev --name init

3. Commit the generated prisma/migrations folder and prisma/migration_lock.toml to git and push.

4. Redeploy on Vercel (the vercel-build script will run prisma migrate deploy in the build).

Important: backup any data if needed before running migration commands against a production DB.
