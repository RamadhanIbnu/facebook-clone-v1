"use client";
import React from "react";
import Avatar from "./Avatar";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

type Reaction = { type: string; userId: string; user?: { id: string; name: string; avatar?: string | null } };
type Message = {
  id: string;
  userId?: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
  recipient?: { id: string; name: string; avatar?: string | null } | null;
  reactions?: Reaction[];
  readBy?: string[];
  readUsers?: { id: string; name: string; avatar?: string | null }[];
};

declare global {
  interface Window { __CURRENT_USER_ID__?: string }
}

export default function MessageItem({ message, currentUserId }: { message: Message; currentUserId?: string | null }) {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const meId = currentUserId ?? user?.id ?? undefined;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [popoverOpen, setPopoverOpen] = React.useState<string | null>(null);
  const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const popoverRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const prevOpenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) setPopoverOpen(null);
    }
    document.addEventListener('click', onDocClick);
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setPopoverOpen(null); }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, []);

  React.useEffect(() => {
    if (popoverOpen) {
      prevOpenRef.current = popoverOpen;
      const pop = popoverRefs.current[popoverOpen];
      if (pop) {
        const el = pop.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])');
        (el ?? pop).focus();
      }
    } else {
      const prev = prevOpenRef.current;
      if (prev) {
        const trg = triggerRefs.current[prev];
        try { trg?.focus(); } catch {}
      }
    }
  }, [popoverOpen]);

  const [localReactions, setLocalReactions] = React.useState<Reaction[]>(message.reactions ?? []);

  const reactionCounts = localReactions.reduce<Record<string, { count: number; users: string[]; usersInfo: { id: string; name: string; avatar?: string | null }[] }>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { count: 0, users: [], usersInfo: [] };
    acc[r.type].count += 1;
    acc[r.type].users.push(r.userId);
    if (r.user) acc[r.type].usersInfo.push(r.user);
    return acc;
  }, {});

  const isReadByMe = !!(message.readBy && meId && message.readBy.includes(meId));

  return (
  <div ref={containerRef} className="p-4 bg-white rounded shadow-sm flex items-start gap-3">
      <div>
        <Avatar name={message.user?.name ?? 'Unknown'} size={40} src={message.user?.avatar ?? undefined} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold flex items-center gap-2">
          <span>{message.user?.name ?? 'Unknown'}</span>
          {message.recipient && (
            <span className="text-xs text-gray-500">→ {message.recipient.name}</span>
          )}
          <span className="text-xs text-gray-400 ml-2">@{(message.user?.name ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0,20)}</span>
        </div>
        <div className="text-sm text-gray-700">{message.text}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-xs text-gray-400">{new Date(message.createdAt).toLocaleString()}</div>
          <div className="ml-auto flex items-center gap-2">
            {Object.entries(reactionCounts).map(([type, info]) => (
              <div key={type} className={`relative text-xs px-2 py-1 bg-gray-100 rounded flex items-center gap-1 ${meId && info.users.includes(meId) ? 'bg-blue-100 font-semibold' : ''}`}>
                <button
                  title={info.usersInfo.map(u => u.name).join(', ')}
                  className="flex items-center gap-1"
                  onClick={() => setPopoverOpen(popoverOpen === type ? null : type)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPopoverOpen(popoverOpen === type ? null : type); } }}
                  aria-haspopup="dialog"
                  aria-expanded={popoverOpen === type}
                  ref={(el) => { triggerRefs.current[type] = el; }}
                >
                  <span>{type === 'like' ? '👍' : type === 'love' ? '❤️' : type}</span>
                  <span>{info.count}</span>
                </button>
                {popoverOpen === type && (
                  <div id={`popover-${message.id}-${type}`} role="dialog" aria-label={`${type} reactors`} className="absolute right-0 bottom-full mb-2 z-50 bg-white border rounded shadow-lg p-2 w-44" ref={(el) => { popoverRefs.current[type] = el; }} tabIndex={-1}>
                    <div className="text-xs font-semibold mb-1">Reacted</div>
                    <div className="flex flex-col gap-1 max-h-40 overflow-auto">
                      {info.usersInfo.length === 0 && <div className="text-xs text-gray-500">No users</div>}
                      {info.usersInfo.map((u) => (
                        <button key={u.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 text-left" onClick={() => { }}>
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <Avatar name={u.name} size={24} src={u.avatar ?? undefined} />
                          </div>
                          <div className="text-sm">{u.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={async () => {
              if (!user) { authModal.open('signin'); return; }
              try {
                const already = localReactions.find(r => r.type === 'like' && r.userId === meId);
                if (already) {
                  setLocalReactions(localReactions.filter(r => !(r.type === 'like' && r.userId === meId)));
                } else {
                  setLocalReactions([{ type: 'like', userId: meId ?? 'me', user: meId ? { id: meId, name: 'You' } : undefined }, ...localReactions]);
                }
                await fetch(`/api/messages/${message.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'like' }) });
              } catch (e) { console.error(e); }
            }} className="text-xs px-2 py-1 bg-gray-100 rounded">👍</button>
            <button onClick={async () => {
              if (!user) { authModal.open('signin'); return; }
              try {
                const already = localReactions.find(r => r.type === 'love' && r.userId === meId);
                if (already) {
                  setLocalReactions(localReactions.filter(r => !(r.type === 'love' && r.userId === meId)));
                } else {
                  setLocalReactions([{ type: 'love', userId: meId ?? 'me', user: meId ? { id: meId, name: 'You' } : undefined }, ...localReactions]);
                }
                await fetch(`/api/messages/${message.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'love' }) });
              } catch (e) { console.error(e); }
            }} className="text-xs px-2 py-1 bg-gray-100 rounded">❤️</button>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
          {isReadByMe ? <span className="text-green-600">Read</span> : <span className="text-gray-400">Unread</span>}
          {message.readUsers && message.readUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {message.readUsers.slice(0, 4).map((r) => (
                <div key={r.id} className="w-6 h-6 rounded-full overflow-hidden" title={r.name}>
                  <Avatar name={r.name} size={24} src={r.avatar ?? undefined} />
                </div>
              ))}
              {message.readUsers.length > 4 && (
                <div className="text-xs text-gray-500">+{message.readUsers.length - 4}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
