import {PrismaClient} from '@prisma/client';

(async () => {
  try {
    const p = new PrismaClient();
    const c = await p.user.count();
    console.log('prisma user.count ->', c);
    await p.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('prisma error:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
