import { PrismaClient } from "@prisma/client";

// Workaround: disable named prepared statements which can cause
// "prepared statement \"s0\" already exists" (Postgres 42P05)
// when using pooled connections (pgBouncer) or during rapid dev server reloads.
// See: set PRISMA_DISABLE_PREPARED_STATEMENTS=1
if (!process.env.PRISMA_DISABLE_PREPARED_STATEMENTS) {
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = "1";
}

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
