"use client";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Feed from "../components/Feed";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUserId(data.user?.id ?? null);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
            <div className="p-4 bg-white dark:bg-gray-800 rounded shadow-sm">Right column (shortcuts)</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
