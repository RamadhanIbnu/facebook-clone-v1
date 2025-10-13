"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PasswordInput from "./PasswordInput";

export default function SignInModal() {
  const { isOpen, close, mode, setMode } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { push } = useToast();
  const { refresh } = useAuth();
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
  // focus trap: constrain focus inside modal
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const validate = () => {
    if (mode === 'signup') {
      if (!name.trim()) return "Please provide your full name.";
    }
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const submit = async () => {
    setError("");
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    const endpoint = mode === "signup" ? '/api/auth/signup' : '/api/auth/signin';
    const payload: Record<string, string> = { email, password };
    if (mode === 'signup') payload.name = name;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    let data: unknown = null;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    }
    setLoading(false);
    if (!res.ok) {
  const getError = (v: unknown): string | undefined => (typeof v === 'object' && v !== null && 'error' in (v as object)) ? ((v as { error?: string }).error) : undefined;
  const errMsg = getError(data);
  setError(errMsg || (mode === 'signup' ? 'Sign up failed' : 'Sign in failed'));
  push({ type: 'error', message: errMsg || 'Authentication failed' });
      return;
    }
    close();
    push({ type: 'success', message: mode === 'signup' ? 'Account created — you are signed in' : 'Signed in' });
  // refresh auth state
  await refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="bg-white rounded p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h2 id="auth-modal-title" className="text-lg font-semibold">{mode === 'signup' ? 'Sign up' : 'Sign in'}</h2>
          <div className="text-sm">
            {mode === 'signup' ? (
              <button onClick={() => setMode('signin')} className="text-blue-600">Have an account? Sign in</button>
            ) : (
              <button onClick={() => setMode('signup')} className="text-blue-600">Create account</button>
            )}
          </div>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {mode === 'signup' && (
          <input ref={firstInputRef} className="w-full p-2 mb-2" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
        )}
        {mode !== 'signup' && (
          <input ref={firstInputRef} className="w-full p-2 mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        )}
        {mode === 'signup' ? (
          <input className="w-full p-2 mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        ) : null}
        {/* Password input */}
        <PasswordInput value={password} onChange={setPassword} placeholder="Password" ariaLabel="Password" />
        <div className="flex gap-2 justify-end">
          <button onClick={close} className="px-4 py-2">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? (mode === 'signup' ? 'Signing up...' : 'Signing in...') : (mode === 'signup' ? 'Sign up' : 'Sign in')}</button>
        </div>
      </div>
    </div>
  );
}
