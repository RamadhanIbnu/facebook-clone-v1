"use client";
import React from "react";
import Image from "next/image";

export default function Avatar({ name, size = 40, src }: { name: string; size?: number; src?: string | null }) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }} className="rounded-full overflow-hidden">
        <Image src={src} alt={name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
