"use client";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import MessageItem from "@/components/MessageItem";
import { getWsClient } from '@/lib/wsClient';

type Message = {
  id: string;
  userId?: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const load = async () => {
    const res = await fetch('/api/messages');
    const json = await res.json();
    setMessages(json.messages ?? []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // reset unread when opening messages
    const client = getWsClient();
    type WsMsg = { type?: string; message?: Message } | null;
    const unsub = client.subscribe((data: unknown) => {
      try {
        const d = data as WsMsg;
        if (d?.type === 'message.created' && d.message) {
          setMessages((m) => [d.message!, ...m]);
        }
      } catch {}
    });
    return () => { unsub(); };
  }, []);

  const post = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessages((m) => [json.message, ...m]);
      setText('');
    }
  };

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="mb-4 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded p-2 border" placeholder="Write a message..." />
          <button onClick={post} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
        </div>

        <div className="space-y-4">
          {messages.map((m) => <MessageItem key={m.id} message={m} />)}
        </div>
      </div>
    </div>
  );
}
