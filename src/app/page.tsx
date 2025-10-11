"use client";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Feed from "../components/Feed";
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <Sidebar currentUserId={currentUserId ?? ""} />
        </aside>

        <section className="md:col-span-2">
          <Feed currentUserId={currentUserId ?? ""} />
        </section>

        <aside className="md:col-span-1 hidden md:block">
          <div className="sticky top-20">
            <div className="p-4 bg-white rounded shadow-sm">Right column (shortcuts)</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
