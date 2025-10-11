"use client";
import React from "react";
import { getUserById } from "../lib/store";
import type { User } from "../lib/componentTypes";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import Avatar from "./Avatar";

type Props = { currentUserId: string };

export default function Sidebar({ currentUserId }: Props) {
  const { user: authUser } = useAuth();
  // prefer avatar/title from the authenticated user when it's the same id
  const user: User | null = currentUserId
    ? authUser && authUser.id === currentUserId
      ? (authUser as User)
      : getUserById(currentUserId)
    : null;

  const authModal = useAuthModal();

  return (
  <div className="p-4 fb-card text-gray-900">
      {user ? (
        <>
          <div className="flex items-center gap-3">
            <div>
              <Avatar name={user.name} size={48} src={user.avatar ?? undefined} />
            </div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-500">{user.title}</div>
            </div>
          </div>

          <nav className="mt-4">
            <ul className="space-y-2 text-sm">
              <li className="p-2 rounded hover:bg-gray-100 flex items-center gap-3 cursor-pointer"><span className="text-xl">🏠</span> <span>News Feed</span></li>
              <li className="p-2 rounded hover:bg-gray-100 flex items-center gap-3 cursor-pointer"><span className="text-xl">👥</span> <span>Friends</span></li>
              <li className="p-2 rounded hover:bg-gray-100 flex items-center gap-3 cursor-pointer"><span className="text-xl">🧑‍🤝‍🧑</span> <span>Groups</span></li>
              <li className="p-2 rounded hover:bg-gray-100 flex items-center gap-3 cursor-pointer"><span className="text-xl">🛍️</span> <span>Marketplace</span></li>
            </ul>
          </nav>
        </>
      ) : (
        <div className="p-4 text-sm">
          <div>Please <button onClick={() => authModal.open()} className="text-blue-600">sign in</button> to see your sidebar.</div>
        </div>
      )}
    </div>
  );
}
