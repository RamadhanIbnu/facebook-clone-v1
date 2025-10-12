/* eslint-disable @typescript-eslint/no-require-imports */
(async () => {
  try {
    console.log('PRISMA_DISABLE_PREPARED_STATEMENTS=', process.env.PRISMA_DISABLE_PREPARED_STATEMENTS);
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const c = await p.user.count();
    console.log('user.count', c);
    await p.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('err', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
