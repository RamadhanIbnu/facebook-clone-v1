(async () => {
  const base = 'http://localhost:3000';
  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

  // helper to sign up or sign in
  async function signupOrSignin(email, name, password) {
    // try sign in first
    let res = await fetch(`${base}/api/auth/signin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), redirect: 'manual' });
    if (res.ok) {
      const data = await res.json();
      return { res, data };
    }
    // try signup
    res = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }), redirect: 'manual' });
    const data = await res.json();
    return { res, data };
  }

  try {
    console.log('Signing in user A...');
    const userAEmail = 'a@example.com';
    const userAPass = 'password123';
    await signupOrSignin(userAEmail, 'User A', userAPass);

    // create second user B via signup
    console.log('Creating user B...');
    const userBEmail = 'b@example.com';
    const userBPass = 'password123';
    const signinB = await signupOrSignin(userBEmail, 'User B', userBPass);

    // fetch user list or user B profile to get id
    console.log('Looking up User B profile...');
    // naive: look up /api/profile by searching posts or users endpoint not present; instead, we will query the profile endpoint by email via /api/profile? email not supported
    // fallback: get /api/auth/me to get current user id
    let res = await fetch(`${base}/api/auth/me`);
    const me = await res.json();
    console.log('Current signed-in (should be B):', me);

    // sign back in as A
    console.log('Signing back in as A...');
    await signupOrSignin(userAEmail, 'User A', userAPass);
    res = await fetch(`${base}/api/auth/me`);
    const authA = await res.json();
    console.log('Signed in as A:', authA);

    // We need the id of B to follow. Try listing posts of B by id: but we don't have an index. Instead, hit /api/profile/:userId with a guess — but we don't know id.
    // Alternate approach: create a new user C with unique email and then follow C using returned id on signup
    console.log('Creating user C to follow...');
    const uniq = Date.now();
    const userCEmail = `c${uniq}@example.com`;
    const userCPass = 'password123';
    const signupCRes = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userCEmail, password: userCPass, name: 'User C' }), redirect: 'manual' });
    const signupCJson = await signupCRes.json();
    console.log('Signed up C:', signupCJson);

    const userCId = signupCJson.user?.id;
    if (!userCId) {
      console.error('Could not create user C, aborting');
      process.exit(1);
    }

    // sign back in as A
    console.log('Signing back in as A for follow tests...');
    await signupOrSignin(userAEmail, 'User A', userAPass);

    // now follow C
    console.log('Following C...');
    res = await fetch(`${base}/api/profile/${userCId}/follow`, { method: 'POST' });
    console.log('POST follow status', res.status);
    let j = null;
    try { j = await res.json(); } catch (e) { j = null; }
    console.log('POST follow body', j);

    // unfollow
    console.log('Unfollowing C...');
    res = await fetch(`${base}/api/profile/${userCId}/follow`, { method: 'DELETE' });
    console.log('DELETE follow status', res.status);
    try { j = await res.json(); } catch (e) { j = null; }
    console.log('DELETE follow body', j);

    console.log('Done');
  } catch (err) {
    console.error('Test failed', err);
  }
})();
