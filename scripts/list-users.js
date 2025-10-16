import {PrismaClient} from '@prisma/client';

(async () => {
  try {
    const p = new PrismaClient();
    const users = await p.user.findMany({ take: 20, select: { id: true, email: true, name: true } });
    console.log('users:', users);
    await p.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
