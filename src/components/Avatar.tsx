"use client";
import React from "react";

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
