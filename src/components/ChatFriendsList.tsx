"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type Friend = { id: string; name: string; avatar?: string | null };

export default function ChatFriendsList({ onSelect, presence }: { onSelect: (friend: Friend) => void; presence?: Record<string, boolean> }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile/following');
        if (!mounted) return;
        if (!res.ok) {
          setFriends([]);
          return;
        }
        const json = await res.json();
        setFriends(json.users ?? []);
      } catch (err) {
        console.warn('Failed loading friends', err);
        if (mounted) setFriends([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-2 text-sm text-gray-500">Loading friends...</div>;
  if (!friends || friends.length === 0) return <div className="p-2 text-sm text-gray-500">No friends to chat with</div>;

  return (
    <div className="p-2 space-y-2">
      {friends.map((f) => (
        <button key={f.id} onClick={() => onSelect(f)} className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-gray-100">
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src={f.avatar ?? '/avatar.png'} alt={f.name} fill sizes="32px" className="object-cover" />
            {presence && presence[f.id] && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{f.name}</div>
            <div className="text-xs text-gray-500">{presence && presence[f.id] ? 'Online' : 'Tap to message'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
