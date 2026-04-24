"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full items-center justify-between p-4 lg:max-w-9xl lg:p-6">
        <div className="text-lg font-semibold text-gray-900">
          <Link href="/dashboard">Dashboard de Supervisores</Link>
        </div>
      </div>
    </header>
  );
}
