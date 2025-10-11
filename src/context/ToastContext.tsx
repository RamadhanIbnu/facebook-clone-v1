"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: string; type: "success" | "error"; message: string };

type Context = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<Context | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const toast: Toast = { id, ...t };
    setToasts((s) => [toast, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }, []);
  const remove = useCallback((id: string) => setToasts((s) => s.filter((x) => x.id !== id)), []);
  return <ToastContext.Provider value={{ toasts, push, remove }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastContainer() {
  const { toasts, remove } = useToast();
  return (
    <div aria-live="polite" className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={`p-3 rounded shadow-sm text-sm ${t.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'} toast-enter-active`}>
          <div className="flex items-center justify-between gap-4">
            <div>{t.message}</div>
            <button aria-label="dismiss" onClick={() => remove(t.id)} className="font-bold">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastProvider;
