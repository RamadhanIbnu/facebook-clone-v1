"use client";
import React, { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function Header() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      setUser(json.user ?? null);
    })();
  }, []);

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    location.href = '/';
  };

  return (
    <header className="w-full bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <div className="font-bold text-xl">Faceclone</div>
        <div className="flex-1" />
        <input
          aria-label="Search"
          className="hidden sm:block bg-gray-100 dark:bg-gray-700 rounded px-3 py-1 text-sm w-64"
          placeholder="Search"
        />
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size={32} />
                <div className="text-sm">{user.name}</div>
              </div>
              <button onClick={signOut} className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Sign out</button>
            </>
          ) : (
            <>
              <a href="/signin" className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Sign in</a>
              <a href="/signup" className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Sign up</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
