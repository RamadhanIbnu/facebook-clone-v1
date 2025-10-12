"use client";
import Avatar from "./Avatar";

type Message = {
  id: string;
  userId?: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null } | null;
};

export default function MessageItem({ message }: { message: Message }) {
  return (
    <div className="p-4 bg-white rounded shadow-sm flex items-start gap-3">
      <div>
        <Avatar name={message.user?.name ?? 'Unknown'} size={40} src={message.user?.avatar ?? undefined} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">
          {message.user?.name ?? 'Unknown'}{' '}
          <span className="text-xs text-gray-400 ml-2">@{(message.user?.name ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0,20)}</span>
        </div>
        <div className="text-sm text-gray-700">{message.text}</div>
        <div className="text-xs text-gray-400 mt-2">{new Date(message.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
}
