 
/* eslint-disable @typescript-eslint/no-require-imports */
(async ()=>{
  try{
    // ignore; prefer runtime src lib if available
  }catch{/* ignore */}
  try{
    const { prisma } = require('../src/lib/prisma');
    const bcrypt = require('bcryptjs');
    const { signToken } = require('../src/lib/auth');
    const email='demo@local.test';
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('user', !!user, user && {id: user.id, email: user.email});
    if(!user) return console.log('no user');
    const ok = await bcrypt.compare('password', user.password||'');
    console.log('password ok?', ok);
    const token = signToken({ userId: user.id });
    console.log('token len', token.length);
    process.exit(0);
  }catch(err){
    console.error('err', err && err.stack?err.stack:err);
    process.exit(1);
  }
})();
