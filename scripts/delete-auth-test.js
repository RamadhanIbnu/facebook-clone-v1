// delete-auth-test.js — Node script to verify delete endpoint ownership semantics
/* eslint-disable @typescript-eslint/no-unused-vars */

(async () => {
  const base = 'http://localhost:3000';
  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

  // simple cookie helper: read Set-Cookie values and merge into a single cookie header string
  function mergeCookies(prev = '', res) {
    const sc = res.headers.raw ? res.headers.raw()['set-cookie'] : res.headers.get('set-cookie');
    if (!sc) return prev;
    const arr = Array.isArray(sc) ? sc : [sc];
    const parsed = arr.map(s => s.split(';')[0]).join('; ');
    if (!prev) return parsed;
    // merge without duplicates
    const map = {};
    prev.split(';').map(p => p.trim()).filter(Boolean).forEach(p => { map[p.split('=')[0]] = p; });
    parsed.split(';').map(p => p.trim()).filter(Boolean).forEach(p => { map[p.split('=')[0]] = p; });
    return Object.values(map).join('; ');
  }

  async function _signup(email, name, password) {
    const res = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }), redirect: 'manual' });
    const body = await safeJson(res);
    return { res, body };
  }

  async function _signin(email, password, cookie = '') {
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['cookie'] = cookie;
    const res = await fetch(`${base}/api/auth/signin`, { method: 'POST', headers, body: JSON.stringify({ email, password }), redirect: 'manual' });
    const body = await safeJson(res);
    return { res, body };
  }

  async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
  }

  try {
    const ownerEmail = `owner${Date.now()}@example.com`;
    const attackerEmail = `attacker${Date.now()}@example.com`;
    const pass = 'password123';

    console.log('Signing up owner...');
    let ownerCookie = '';
    let r = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass, name: 'Owner' }), redirect: 'manual' });
    ownerCookie = mergeCookies(ownerCookie, r);
  let _ownerJson = await safeJson(r);
  console.log('Owner signup status', r.status, _ownerJson && _ownerJson.user ? `id=${_ownerJson.user.id}` : 'no-user');

    console.log('Signing up attacker...');
    let attackerCookie = '';
    r = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass, name: 'Attacker' }), redirect: 'manual' });
    attackerCookie = mergeCookies(attackerCookie, r);
  let _attackerJson = await safeJson(r);
  console.log('Attacker signup status', r.status, _attackerJson && _attackerJson.user ? `id=${_attackerJson.user.id}` : 'no-user');

    // ensure we are signed in as owner for creation
    console.log('Ensuring owner session via signin (capturing cookies)...');
    r = await fetch(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass }), redirect: 'manual' });
    ownerCookie = mergeCookies(ownerCookie, r);
    await safeJson(r);

    // create a post as owner
    console.log('Creating a post as owner...');
    r = await fetch(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ownerCookie }, body: JSON.stringify({ content: 'Test post from owner' }) });
    const postCreate = await safeJson(r);
    console.log('Post create status', r.status, postCreate);
    const postId = postCreate?.post?.id;
    if (!postId) {
      console.error('Could not create post, aborting');
      process.exit(1);
    }

    // create a comment on the post as owner
    console.log('Creating a comment as owner...');
    r = await fetch(`${base}/api/posts/${postId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ownerCookie }, body: JSON.stringify({ content: 'Owner comment' }) });
    const commentCreate = await safeJson(r);
    console.log('Comment create status', r.status, commentCreate);
    const commentId = commentCreate?.comment?.id || commentCreate?.comments?.[0]?.id;
    if (!commentId) {
      console.error('Could not create comment, aborting');
      process.exit(1);
    }

    // Attempt delete as owner
    console.log('\nAttempting deletes as OWNER (should succeed)');
    r = await fetch(`${base}/api/posts/${postId}`, { method: 'DELETE', headers: { cookie: ownerCookie } });
    console.log('DELETE post status (owner):', r.status);
  try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    // Recreate post & comment to test attacker delete (since post was deleted)
    console.log('\nRecreating post as owner for attacker test...');
    r = await fetch(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ownerCookie }, body: JSON.stringify({ content: 'Test post for attacker' }) });
    const postCreate2 = await safeJson(r);
    const postId2 = postCreate2?.post?.id;
    console.log('New post id', postId2);
    if (!postId2) { console.error('Could not create second post, aborting'); process.exit(1); }

    console.log('Creating comment as owner on new post...');
    r = await fetch(`${base}/api/posts/${postId2}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ownerCookie }, body: JSON.stringify({ content: 'Owner comment for attacker test' }) });
    const commentCreate2 = await safeJson(r);
    const commentId2 = commentCreate2?.comment?.id || commentCreate2?.comments?.[0]?.id;
    console.log('New comment id', commentId2);

    // Ensure attacker session via signin (capture cookie)
    console.log('Signing in attacker to capture session cookie...');
    r = await fetch(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass }), redirect: 'manual' });
    attackerCookie = mergeCookies(attackerCookie, r);
    await safeJson(r);

    // Attempt delete as attacker
    console.log('\nAttempting deletes as ATTACKER (should be forbidden)');
    r = await fetch(`${base}/api/posts/${postId2}`, { method: 'DELETE', headers: { cookie: attackerCookie } });
    console.log('DELETE post status (attacker):', r.status);
  try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    r = await fetch(`${base}/api/posts/${postId2}/comment/${commentId2}`, { method: 'DELETE', headers: { cookie: attackerCookie } });
    console.log('DELETE comment status (attacker):', r.status);
  try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    console.log('\nDone');
  } catch (err) {
    console.error('Test failed', err);
    process.exit(1);
  }
  // reference helpers to satisfy strict "noUnusedLocals" checks in the TypeScript build
  void signup;
  void signin;
})();
