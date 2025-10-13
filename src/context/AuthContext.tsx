"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; name: string; email?: string | null; avatar?: string | null } | null;

type AuthContextType = {
  user: User;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setUser(null);
        return;
      }
      let json: unknown = null;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        try { json = await res.json(); } catch { json = null; }
      }
      const getUser = (v: unknown) => (typeof v === 'object' && v !== null && 'user' in (v as object)) ? (v as { user: User }).user : null;
      setUser(getUser(json));
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // load current user on mount
    refresh();
  }, []);

  return <AuthContext.Provider value={{ user, setUser, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthProvider;
