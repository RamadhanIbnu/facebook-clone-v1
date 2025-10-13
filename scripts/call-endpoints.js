/* eslint-disable @typescript-eslint/no-require-imports */
const fetch = require('node-fetch');

(async ()=>{
  try{
    const base = 'http://localhost:3000';
    console.log('POST /api/auth/signin');
    const credRes = await fetch(base + '/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@local.test', password: 'password' }),
    });
    console.log('signin status', credRes.status);
    const text = await credRes.text();
    console.log('signin body:', text);
    const cookies = credRes.headers.raw()['set-cookie'];
    console.log('set-cookie headers:', cookies);

    console.log('\nGET /api/auth/me');
    const meRes = await fetch(base + '/api/auth/me', {
      headers: { cookie: cookies ? cookies.join('; ') : '' }
    });
    console.log('me status', meRes.status);
    console.log('me body', await meRes.text());

    console.log('\nGET /api/posts');
    const postsRes = await fetch(base + '/api/posts');
    console.log('posts status', postsRes.status);
    console.log('posts body', await postsRes.text());

  }catch(err){
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
