"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full items-center p-4 lg:max-w-9xl lg:p-6">
        <img
          src="/Logo_complete_and_phrase.webp"
          alt="Logo"
          className="h-20 w-auto"
        />
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-normal font-bold text-gray-900 transition-colors duration-200 hover:text-gray-600"
          >
            Dashboard
          </Link>
          <a
            href="/Marcas Foco Condiciones Nacionales - Abril V1.4.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-normal font-bold text-gray-900 transition-colors duration-200 hover:text-gray-600"
          >
            Marcas Activas
          </a>
        </nav>
      </div>
    </header>
  );
}
