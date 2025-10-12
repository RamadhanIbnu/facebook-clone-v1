"use client";
import React from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faVideo, faUsers, faStore, faSearch, faPlus, faComments, faBell } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { getWsClient } from '@/lib/wsClient';

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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const client = getWsClient();
    type MessageEventShape = { type?: string; message?: { id?: string } } | null;
    const unsub = client.subscribe((data: unknown) => {
      try {
        const d = data as MessageEventShape;
        if (d?.type === 'message.created') {
          setUnread((u) => u + 1);
        }
      } catch {}
    });
    return () => { unsub(); };
  }, []);

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
              <FontAwesomeIcon icon={faHouse} className="w-6 h-6" />
            </Link>
            <HeaderIcon label="Watch" ariaLabel="Watch">
              <FontAwesomeIcon icon={faVideo} className="w-6 h-6" />
            </HeaderIcon>
            <HeaderIcon label="Groups" ariaLabel="Groups">
              <FontAwesomeIcon icon={faUsers} className="w-6 h-6" />
            </HeaderIcon>
            <Link href="/messages" aria-label="Messages" title="Messages" className="px-4 py-2 rounded-md hover:bg-white/10 text-white flex items-center focus:outline-none focus:ring-2 focus:ring-white/50">
              <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
            </Link>
            <HeaderIcon label="Marketplace" ariaLabel="Marketplace">
              <FontAwesomeIcon icon={faStore} className="w-6 h-6" />
            </HeaderIcon>
          </nav>

            <div className="ml-3 flex items-center md:ml-6">
            <div className="items-center bg-white rounded-full px-3 py-1 w-56 shadow-sm hidden sm:flex text-gray-800">
              <FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-gray-400 mr-2" />
              <input aria-label="Search" placeholder="Search Faceclone" className="outline-none flex-1 text-sm" />
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button aria-label="Create" className="p-2 rounded-full hover:bg-white/10 text-white hidden sm:inline-flex">
            <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
          </button>

          <Link href="/messages" aria-label="Messenger" className="relative p-2 rounded-full hover:bg-white/10 text-white">
            <FontAwesomeIcon icon={faComments} className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unread}</span>
            )}
          </Link>

          <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-white/10 text-white">
            <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
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
