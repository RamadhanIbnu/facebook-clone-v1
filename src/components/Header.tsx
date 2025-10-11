"use client";
import React from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, setUser, refresh } = useAuth();
  const authModal = useAuthModal();

  const router = useRouter();
  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
  // refresh auth state and navigate home
    await refresh();
    router.push('/');
  };

  return (
  <header className="w-full fb-header sticky top-0 z-50 text-white shadow-sm backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center gap-4 min-h-[56px]">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <div className="fb-logo">Faceclone</div>
        </div>

        {/* Center: nav icons + search */}
        <div className="flex-1 flex items-center justify-center">
          <nav className="hidden md:flex items-center gap-1 bg-transparent text-white">
            <Link href="/" aria-label="Home" title="Home" className="px-4 py-2 rounded-md hover:bg-white/10 text-white flex items-center focus:outline-none focus:ring-2 focus:ring-white/50">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11.5V21h7v-6h4v6h7V11.5L12 3z"/></svg>
            </Link>
            <HeaderIcon label="Watch" ariaLabel="Watch">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 16l5-4-5-4v8zM21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </HeaderIcon>
            <HeaderIcon label="Groups" ariaLabel="Groups">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z"/></svg>
            </HeaderIcon>
            <HeaderIcon label="Marketplace" ariaLabel="Marketplace">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v2H4zM6 7h12v12H6z"/></svg>
            </HeaderIcon>
          </nav>

            <div className="ml-3 flex items-center md:ml-6">
            <div className="items-center bg-white rounded-full px-3 py-1 w-56 shadow-sm hidden sm:flex text-gray-800">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm8.707 1.293l-4.387-4.387A9 9 0 1019 19a8.96 8.96 0 003.707-1.707z"></path></svg>
              <input aria-label="Search" placeholder="Search Faceclone" className="outline-none flex-1 text-sm" />
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button aria-label="Create" className="p-2 rounded-full hover:bg-white/10 text-white hidden sm:inline-flex">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14m7-7H5" /></svg>
          </button>

          <button aria-label="Messenger" className="relative p-2 rounded-full hover:bg-white/10 text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7 3 3 6.58 3 11c0 2.5 1.37 4.73 3.5 6.09V21l3.09-1.6C11.05 19.9 11.52 20 12 20c5 0 9-3.58 9-8s-4-9-9-9z"></path></svg>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">3</span>
          </button>

          <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-white/10 text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">5</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <a href={`/profile/${user.id}`} className="flex items-center gap-2">
                <Avatar name={user.name} src={user.avatar ?? undefined} size={36} />
              </a>
              <button onClick={signOut} className="text-sm px-3 py-1 rounded bg-white/10 text-white">Sign out</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => authModal.open()} className="text-sm px-3 py-1 rounded bg-white/10 text-white">Sign in</button>
              <button onClick={() => authModal.open('signup')} className="text-sm px-3 py-1 rounded bg-white text-blue-600">Sign up</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({ children, label, ariaLabel }: { children: React.ReactNode; label?: string; ariaLabel?: string }) {
  return (
    <button aria-label={ariaLabel ?? label} title={label} className="px-4 py-2 rounded-md hover:bg-white/10 text-white flex items-center focus:outline-none focus:ring-2 focus:ring-white/50" >
      {children}
    </button>
  );
}
