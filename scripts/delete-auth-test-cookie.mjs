/* ESM cookie-enabled delete auth test (Node 18+). */
import fetch from 'node-fetch';
import {CookieJar} from 'tough-cookie';

const base = 'http://localhost:3000';
const jar = new CookieJar();

// helper to attach cookies for a URL from the jar and update jar with Set-Cookie from response
async function fetchWithJar(url, opts = {}, jarParam = jar) {
  const cookieHeader = await new Promise((res, rej) => jarParam.getCookieString(url, (err, c) => err ? rej(err) : res(c)));
  opts.headers = opts.headers ? {...opts.headers, cookie: cookieHeader} : { cookie: cookieHeader };
  const r = await fetch(url, opts);
  const sc = r.headers.get('set-cookie');
  if (sc) {
    // set-cookie may be multiple; node-fetch returns a single string for the header but may include comma-separated cookies.
    // tough-cookie expects one cookie at a time. Attempt split on , and set individually.
    const parts = Array.isArray(sc) ? sc : sc.split(/,(?=[^;]+=)/g);
    for (const p of parts) {
      try {
        await new Promise((res, rej) => jarParam.setCookie(p.trim(), url, {ignoreError: true}, (err, cookie) => err ? rej(err) : res(cookie)));
      } catch {
        // ignore cookie set errors
      }
    }
  }
  return r;
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

(async () => {
  try {
    const ownerEmail = `owner${Date.now()}@example.com`;
    const attackerEmail = `attacker${Date.now()}@example.com`;
    const pass = 'password123';

    console.log('Signing up owner...');
  let r = await fetchWithJar(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass, name: 'Owner' }), redirect: 'manual' }, jar);
    const ownerJson = await safeJson(r);
    console.log('Owner signup status', r.status, ownerJson && ownerJson.user ? `id=${ownerJson.user.id}` : 'no-user');

    console.log('Signing up attacker...');
  r = await fetchWithJar(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass, name: 'Attacker' }), redirect: 'manual' }, jar);
    const attackerJson = await safeJson(r);
    console.log('Attacker signup status', r.status, attackerJson && attackerJson.user ? `id=${attackerJson.user.id}` : 'no-user');

    // ensure owner session
    console.log('Ensuring owner session via signin...');
  r = await fetchWithJar(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass }), redirect: 'manual' }, jar);
    await safeJson(r);

    // create a post as owner
    console.log('Creating a post as owner...');
  r = await fetchWithJar(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Test post from owner' }) }, jar);
    const postCreate = await safeJson(r);
    console.log('Post create status', r.status, postCreate);
    const postId = postCreate?.post?.id;
    if (!postId) { console.error('Could not create post, aborting'); process.exit(1); }

    // create a comment on the post as owner
    console.log('Creating a comment as owner...');
  r = await fetchWithJar(`${base}/api/posts/${postId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Owner comment' }) }, jar);
    const commentCreate = await safeJson(r);
    console.log('Comment create status', r.status, commentCreate);
    const commentId = commentCreate?.comment?.id || commentCreate?.comments?.[0]?.id;
    if (!commentId) { console.error('Could not create comment, aborting'); process.exit(1); }

    // Attempt delete as owner
    console.log('\nAttempting deletes as OWNER (should succeed)');
  r = await fetchWithJar(`${base}/api/posts/${postId}`, { method: 'DELETE' }, jar);
    console.log('DELETE post status (owner):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    // Recreate post & comment to test attacker delete
    console.log('\nRecreating post as owner for attacker test...');
  r = await fetchWithJar(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Test post for attacker' }) }, jar);
    const postCreate2 = await safeJson(r);
    const postId2 = postCreate2?.post?.id;
    console.log('New post id', postId2);
    if (!postId2) { console.error('Could not create second post, aborting'); process.exit(1); }

    console.log('Creating comment as owner on new post...');
  r = await fetchWithJar(`${base}/api/posts/${postId2}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Owner comment for attacker test' }) }, jar);
    const commentCreate2 = await safeJson(r);
    const commentId2 = commentCreate2?.comment?.id || commentCreate2?.comments?.[0]?.id;
    console.log('New comment id', commentId2);

    // Sign in as attacker using separate jar
    console.log('Signing in attacker (new jar) to capture attacker session...');
  const attackerJar = new CookieJar();
  r = await fetchWithJar(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass }), redirect: 'manual' }, attackerJar);
    await safeJson(r);

    // Attempt delete as attacker
    console.log('\nAttempting deletes as ATTACKER (should be forbidden)');
  r = await fetchWithJar(`${base}/api/posts/${postId2}`, { method: 'DELETE' }, attackerJar);
    console.log('DELETE post status (attacker):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

  r = await fetchWithJar(`${base}/api/posts/${postId2}/comment/${commentId2}`, { method: 'DELETE' }, attackerJar);
    console.log('DELETE comment status (attacker):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    console.log('\nDone');
  } catch (err) {
    console.error('Test failed', err);
    process.exit(1);
  }
})();
