"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMinimize, faWindowRestore } from '@fortawesome/free-solid-svg-icons';
import { getWsClient } from "@/lib/wsClient";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import MessageItem from "./MessageItem";
import ChatFriendsList from "./ChatFriendsList";

type Message = {
  id: string;
  userId?: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
  reactions?: { type: string; userId: string }[];
  readBy?: string[];
};

export default function ChatWidget() {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [currentRecipient, setCurrentRecipient] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const url = recipientId ? `/api/messages?recipientId=${encodeURIComponent(recipientId)}` : '/api/messages';
      const res = await fetch(url);
      const json = await res.json();
      let msgs = json.messages ?? [];
      if (recipientId) msgs = (msgs as Message[]).slice().reverse();
      setMessages(msgs);
    } catch (e) {
      console.warn('Failed loading messages', e);
    }
  }, [recipientId]);

  // load messages only when user is present (lazy init)
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setUnread(0);
      return;
    }
    load();
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [recipientId, user, load]);

  // load persisted UI state
  useEffect(() => {
    try {
      const p = localStorage.getItem('chat:position');
      const m = localStorage.getItem('chat:minimized');
      if (p === 'left' || p === 'right') setPosition(p as 'left' | 'right');
      if (m === '1') setMinimized(true);
    } catch {}
  }, []);

  useEffect(() => {
    try { console.debug('ChatWidget state', { position, open, minimized }); } catch {}
  }, [position, open, minimized]);

  const containerStyle: React.CSSProperties = { position: 'fixed', zIndex: 99999, pointerEvents: 'auto', transform: 'translateZ(0)', bottom: 16, right: 16 };
  const alignClass = position === 'left' ? 'items-start' : 'items-end';

  useEffect(() => {
    if (!user) return;
    const client = getWsClient();
    type WsMsg = { type?: string; message?: Message } | null;
    const unsub = client.subscribe((data: unknown) => {
      try {
        const d = data as WsMsg & { recipientId?: string | null } & Record<string, unknown>;
        // handle presence and typing events
        if (d && (d as Record<string, unknown>)['type'] === 'presence') {
          const p = d as unknown as { type: string; userId?: string; online?: boolean };
          if (p && p.userId) setPresenceMap((m) => ({ ...m, [p.userId as string]: Boolean(p.online) }));
          return;
        }
        if (d && (d as Record<string, unknown>)['type'] === 'typing') {
          const t = d as unknown as { type: string; userId?: string; to?: string; typing?: boolean };
          if (t && t.userId && t.to) {
            // only track typing for threads involving me
            const meId = user?.id ?? null;
            if (t.to === meId || t.userId === meId) {
              // mark typing for the conversation partner
              const partner = t.userId === meId ? t.to : t.userId;
              setTypingMap((m) => ({ ...m, [partner as string]: Boolean(t.typing) }));
            }
          }
          return;
        }
        if (d && ((d as Record<string, unknown>)['type'] === 'reaction.created' || (d as Record<string, unknown>)['type'] === 'reaction.removed')) {
          // refetch messages for current thread so reactions update in UI
          try { load(); } catch {}
          return;
        }
        if (d && (d as Record<string, unknown>)['type'] === 'message.created' && (d as Record<string, unknown>)['message']) {
          const incoming = (d as Record<string, unknown>)['message'] as unknown as Record<string, unknown>;
          // incoming may include recipientId on the published payload (preferred) or nested on the message
          const publishedRecipient = (d as Record<string, unknown>)['recipientId'] as string | null | undefined;
          let incomingRecipient: string | null | undefined = undefined;
          if (publishedRecipient === null) incomingRecipient = null;
          else if (typeof publishedRecipient === 'string') incomingRecipient = publishedRecipient;
          else if (incoming && typeof incoming === 'object' && Object.prototype.hasOwnProperty.call(incoming, 'recipient')) {
            const rec = incoming['recipient'] as Record<string, unknown> | undefined;
            if (rec && typeof rec['id'] === 'string') incomingRecipient = rec['id'] as string;
          }

          // derive incoming user's id robustly from either the scalar userId or nested user.id
          let incomingUserId: string | null | undefined = undefined;
          if (incoming && typeof incoming === 'object') {
            if ('userId' in incoming && (incoming['userId'] === null || typeof incoming['userId'] === 'string')) {
              incomingUserId = incoming['userId'] as string | null | undefined;
            }
            if ((incomingUserId === undefined || incomingUserId === null) && Object.prototype.hasOwnProperty.call(incoming, 'user')) {
              const u = incoming['user'] as Record<string, unknown> | undefined;
              if (u && typeof u['id'] === 'string') incomingUserId = u['id'] as string;
            }
          }

          const meId = user?.id ?? null;
          let matchesThread = false;

          if (recipientId && meId) {
            // viewing a specific thread: show only messages that are part of this two-way thread
            if ((incomingRecipient && incomingRecipient === recipientId && incomingUserId === meId) ||
                (incomingRecipient && incomingRecipient === meId && incomingUserId === recipientId)) {
              matchesThread = true;
            }
          } else {
            if (incomingRecipient == null) matchesThread = true;
          }

          const amIRecipient = incomingRecipient !== undefined && incomingRecipient === meId;

          if (matchesThread) {
            setMessages((m) => [incoming as Message, ...m].slice(0, 50));
            if (!open || minimized) setUnread((u) => u + 1);
          } else if (amIRecipient) {
            setUnread((u) => u + 1);
          }
        }
      } catch (err) {
        console.error('ws handler error', err);
      }
    });
      try {
        const meId = user?.id;
        if (meId) client.send({ type: 'presence', userId: meId, online: true });
      } catch {}
    return () => { unsub(); };
  }, [user, open, minimized, recipientId, load]);

  useEffect(() => {
    if (open && !minimized) setUnread(0);
  }, [open, minimized]);

  // auto-scroll to bottom when messages change or a thread is opened
  useEffect(() => {
    try {
      if (!scrollerRef.current) return;
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    } catch {}
  }, [messages, recipientId, open]);


  const post = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, recipientId }) });
  let json: unknown = null;
  try { json = await res.json(); } catch { /* non-json response */ }
      if (!res.ok) {
        console.warn('POST /api/messages failed', res.status, json);
        if (res.status === 401) {
          try { authModal.open('signin'); } catch {}
        }
        return;
      }
      if (json && typeof json === 'object' && 'message' in (json as Record<string, unknown>)) {
        const msg = (json as Record<string, unknown>)['message'] as unknown;
        setMessages((m) => [(msg as Message), ...m].slice(0, 50));
        setText('');
        try {
          const client = getWsClient();
          const meId = user?.id;
          if (meId) client.send({ type: 'typing', userId: meId, to: recipientId ?? null, typing: false });
        } catch {}
      } else {
        console.warn('POST /api/messages: response missing message payload', json);
      }
    } catch (e) {
      console.warn('Failed posting message', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {user && (
        <div>
          
          <div role="chat-widget" style={containerStyle}>
            <div className={`flex flex-col ${alignClass} gap-2`}> 
              {open && (
                <div
                  className={`bg-white shadow-lg rounded-lg overflow-hidden flex flex-col ${minimized ? 'scale-y-95 opacity-90' : 'scale-y-100 opacity-100'}`}
                  style={{
                    width: '20rem',
                    maxWidth: '24rem',
                  }}
                >
                  
                  <div className="px-3 py-2 bg-blue-600 text-white flex items-center justify-between cursor-default touch-none select-none">
                    <div className="font-semibold">Messenger</div>
                    <div className="flex items-center gap-2">
                      <button aria-label={minimized ? 'Restore chat' : 'Minimize chat'} title={minimized ? 'Restore' : 'Minimize'} onClick={() => {
                        try { localStorage.setItem('chat:minimized', '1'); } catch {}
                        setMinimized(true);
                        setOpen(false);
                      }} className="text-sm px-2 py-1 bg-white/10 rounded flex items-center justify-center">
                        <FontAwesomeIcon icon={minimized ? faWindowRestore : faWindowMinimize} className="w-4 h-4 text-white" />
                      </button>
                      <div className="text-sm opacity-90">{messages.length}</div>
                    </div>
                  </div>
                  <div ref={scrollerRef} className={`p-2 space-y-2 h-64 overflow-auto bg-gray-50 transition-all ${minimized ? 'hidden' : ''}`}>
                    
                    {currentRecipient && (
                      <div className="flex items-center justify-between p-2 bg-white border rounded">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image src={currentRecipient.avatar ?? '/avatar.png'} alt={currentRecipient.name} fill sizes="32px" className="object-cover" />
                          </div>
                          <div className="text-sm font-semibold">
                            {currentRecipient.name}
                            {typingMap && typingMap[currentRecipient.id] ? <span className="text-xs text-gray-500 ml-2"> • typing…</span> : null}
                          </div>
                        </div>
                        <div>
                          <button onClick={() => { setRecipientId(null); setCurrentRecipient(null); load(); }} className="text-sm px-2 py-1 bg-gray-100 rounded">Clear</button>
                        </div>
                      </div>
                    )}
                    
                    <ChatFriendsList presence={presenceMap} onSelect={(f) => {
                      // set the thread recipient and prefill message input and focus
                      try { setRecipientId(f.id); setCurrentRecipient({ id: f.id, name: f.name, avatar: f.avatar ?? undefined }); } catch {}
                      try { setText(`@${f.name} `); } catch {}
                      try { inputRef.current?.focus(); } catch {}
                      // mark conversation as read (persist unread state)
                      try { fetch('/api/messages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: f.id }) }); } catch {}
                    }} />
                    {messages.length === 0 && <div className="text-center text-sm text-gray-500 p-4">No messages yet</div>}
                    {messages.map((m) => <MessageItem key={m.id} message={m} currentUserId={user?.id ?? null} />)}
                  </div>
                  {!minimized && (
                    <div className="p-2 bg-white border-t flex gap-2">
                      <input ref={inputRef} value={text} onChange={(e) => {
                        const val = e.target.value;
                        setText(val);
                        try {
                          const client = getWsClient();
                          const meId = user?.id;
                          if (meId) {
                            client.send({ type: 'typing', userId: meId, to: recipientId ?? null, typing: true });
                            // debounce stop using ref
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                            }
                            typingTimeoutRef.current = window.setTimeout(() => {
                              try { client.send({ type: 'typing', userId: meId, to: recipientId ?? null, typing: false }); } catch {}
                              typingTimeoutRef.current = null;
                            }, 1000);
                          }
                        } catch {}
                      }} className="flex-1 rounded p-2 border" placeholder="Write a message..." />
                      <button onClick={post} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? '...' : 'Send'}</button>
                    </div>
                  )}
                </div>
              )}

              {!open && (
                <button
                  aria-label="Toggle chat"
                  title="Messenger"
                  className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:scale-105 transition-transform"
                      onClick={() => {
                        if (!user) {
                          // prompt sign in
                          authModal.open('signin');
                          return;
                        }
                        try { localStorage.removeItem('chat:minimized'); } catch {}
                        setMinimized(false);
                        setOpen(true);
                      }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m2 8l-4-4H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" /></svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unread}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
