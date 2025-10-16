import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

(async () => {
  try {
    const p = new PrismaClient();
    const email = 'demo@local.test';
    const user = await p.user.findUnique({ where: { email } });
    console.log('user found?', !!user);
    if (!user) return process.exit(0);
    console.log('user record:', { id: user.id, email: user.email, passwordHash: !!user.password });
    const ok = await bcrypt.compare('password', user.password || '');
    console.log('password matches?', ok);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    console.log('token len', token.length);
    await p.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
