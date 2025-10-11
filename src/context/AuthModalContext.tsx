"use client";
import React, { createContext, useContext, useState } from "react";

type AuthMode = "signin" | "signup";

type Context = {
  isOpen: boolean;
  mode: AuthMode;
  open: (mode?: AuthMode) => void;
  close: () => void;
  setMode: (m: AuthMode) => void;
};

const AuthModalContext = createContext<Context | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const open = (m: AuthMode = "signin") => {
    setMode(m);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);
  return (
    <AuthModalContext.Provider value={{ isOpen, mode, open, close, setMode }}>{children}</AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
