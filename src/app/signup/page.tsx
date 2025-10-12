"use client";
import React, { useState } from "react";
import PasswordInput from "../../components/PasswordInput";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setError("");
    if (!name || !email || !password) return setError('Name, email and password are required');
    setLoading(true);
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Sign up failed');
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input className="w-full p-2 mb-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full p-2 mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
      <div className="flex gap-2">
  <button onClick={submit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Signing up...' : 'Sign up'}</button>
      </div>
    </div>
  );
}
