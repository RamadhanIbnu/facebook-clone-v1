"use client";
import Avatar from "./Avatar";

type Message = {
  id: string;
  userId?: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
  recipient?: { id: string; name: string; avatar?: string | null } | null;
};

export default function MessageItem({ message }: { message: Message }) {
  return (
    <div className="p-4 bg-white rounded shadow-sm flex items-start gap-3">
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
            <button onClick={async () => { try { await fetch(`/api/messages/${message.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'like' }) }); } catch (e) { console.error(e); } }} className="text-xs px-2 py-1 bg-gray-100 rounded">👍</button>
            <button onClick={async () => { try { await fetch(`/api/messages/${message.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'love' }) }); } catch (e) { console.error(e); } }} className="text-xs px-2 py-1 bg-gray-100 rounded">❤️</button>
          </div>
        </div>
      </div>
    </div>
  );
}
