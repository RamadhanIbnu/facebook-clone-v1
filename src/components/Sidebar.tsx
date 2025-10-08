"use client";
import React from "react";
import { getUserById, type User } from "../lib/store";
import Avatar from "./Avatar";

type Props = { currentUserId: string };

export default function Sidebar({ currentUserId }: Props) {
  const user: User | null = currentUserId ? getUserById(currentUserId) : null;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow-sm">
      {user ? (
        <>
          <div className="flex items-center gap-3">
            <div>
              <Avatar name={user.name} size={48} />
            </div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.title}</div>
            </div>
          </div>

          <nav className="mt-4">
            <ul className="space-y-2 text-sm">
              <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">Friends</li>
              <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">Groups</li>
              <li className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">Marketplace</li>
            </ul>
          </nav>
        </>
      ) : (
        <div className="p-4 text-sm">
          <div>Please <a href="/signin" className="text-blue-600">sign in</a> to see your sidebar.</div>
        </div>
      )}
    </div>
  );
}
