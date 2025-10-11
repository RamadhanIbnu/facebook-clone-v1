// delete-auth-test-cookie.js — uses a CookieJar (tough-cookie) with fetch-cookie + node-fetch

(async () => {
  const base = 'http://localhost:3000';
  const fetch = require('node-fetch');
  const tough = require('tough-cookie');
  const fetchCookie = require('fetch-cookie');

  const jar = new tough.CookieJar();
  const fetchWithCookies = fetchCookie(fetch, jar);

  async function safeJson(res) {
    try { return await res.json(); } catch (e) { return null; }
  }

  try {
    const ownerEmail = `owner${Date.now()}@example.com`;
    const attackerEmail = `attacker${Date.now()}@example.com`;
    const pass = 'password123';

    console.log('Signing up owner...');
    let r = await fetchWithCookies(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass, name: 'Owner' }), redirect: 'manual' });
    const ownerJson = await safeJson(r);
    console.log('Owner signup status', r.status, ownerJson && ownerJson.user ? `id=${ownerJson.user.id}` : 'no-user');

    console.log('Signing up attacker...');
    r = await fetchWithCookies(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass, name: 'Attacker' }), redirect: 'manual' });
    const attackerJson = await safeJson(r);
    console.log('Attacker signup status', r.status, attackerJson && attackerJson.user ? `id=${attackerJson.user.id}` : 'no-user');

    // ensure owner session (jar now has cookies)
    console.log('Ensuring owner session via signin...');
    r = await fetchWithCookies(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: pass }), redirect: 'manual' });
    await safeJson(r);

    // create a post as owner
    console.log('Creating a post as owner...');
    r = await fetchWithCookies(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Test post from owner' }) });
    const postCreate = await safeJson(r);
    console.log('Post create status', r.status, postCreate);
    const postId = postCreate?.post?.id;
    if (!postId) {
      console.error('Could not create post, aborting');
      process.exit(1);
    }

    // create a comment on the post as owner
    console.log('Creating a comment as owner...');
    r = await fetchWithCookies(`${base}/api/posts/${postId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Owner comment' }) });
    const commentCreate = await safeJson(r);
    console.log('Comment create status', r.status, commentCreate);
    const commentId = commentCreate?.comment?.id || commentCreate?.comments?.[0]?.id;
    if (!commentId) {
      console.error('Could not create comment, aborting');
      process.exit(1);
    }

    // Attempt delete as owner
    console.log('\nAttempting deletes as OWNER (should succeed)');
    r = await fetchWithCookies(`${base}/api/posts/${postId}`, { method: 'DELETE' });
    console.log('DELETE post status (owner):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    // Recreate post & comment to test attacker delete
    console.log('\nRecreating post as owner for attacker test...');
    r = await fetchWithCookies(`${base}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Test post for attacker' }) });
    const postCreate2 = await safeJson(r);
    const postId2 = postCreate2?.post?.id;
    console.log('New post id', postId2);
    if (!postId2) { console.error('Could not create second post, aborting'); process.exit(1); }

    console.log('Creating comment as owner on new post...');
    r = await fetchWithCookies(`${base}/api/posts/${postId2}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Owner comment for attacker test' }) });
    const commentCreate2 = await safeJson(r);
    const commentId2 = commentCreate2?.comment?.id || commentCreate2?.comments?.[0]?.id;
    console.log('New comment id', commentId2);

    // Sign in as attacker in the same process but use a fresh CookieJar for attacker session
    console.log('Signing in attacker (new jar) to capture attacker session...');
    const attackerJar = new tough.CookieJar();
    const fetchAttacker = fetchCookie(fetch, attackerJar);
    r = await fetchAttacker(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: attackerEmail, password: pass }), redirect: 'manual' });
    await safeJson(r);

    // Attempt delete as attacker
    console.log('\nAttempting deletes as ATTACKER (should be forbidden)');
    r = await fetchAttacker(`${base}/api/posts/${postId2}`, { method: 'DELETE' });
    console.log('DELETE post status (attacker):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    r = await fetchAttacker(`${base}/api/posts/${postId2}/comment/${commentId2}`, { method: 'DELETE' });
    console.log('DELETE comment status (attacker):', r.status);
    try { console.log('Body:', await r.text()); } catch { console.log('No body'); }

    console.log('\nDone');
  } catch (err) {
    console.error('Test failed', err);
    process.exit(1);
  }
})();
