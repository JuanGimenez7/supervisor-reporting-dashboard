"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full items-center p-4 lg:max-w-9xl lg:p-6">
        <img
          src="/logo_solo.jpg"
          alt="Logo"
          className="h-6 w-auto mr-4 lg:hidden"
        />
        <img
          src="/Logo_complete_and_phrase.webp"
          alt="Logo"
          className="hidden h-20 w-auto lg:block"
        />
        <nav className="flex items-center gap-3 lg:gap-6">
          <Link
            href="/dashboard"
            className={`text-xs font-bold transition-colors duration-200 hover:text-gray-600 lg:text-base ${
              pathname === "/dashboard"
                ? "text-gray-900 border-b-2 border-gray-900 pb-1"
                : "text-gray-900"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/concursos"
            className={`text-xs font-bold transition-colors duration-200 hover:text-gray-600 lg:text-base ${
              pathname === "/concursos"
                ? "text-gray-900 border-b-2 border-gray-900 pb-1"
                : "text-gray-900"
            }`}
          >
            Concursos
          </Link>
          <a
            href="/Marcas Foco Condiciones Nacionales - Abril V1.4.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-gray-900 transition-colors duration-200 hover:text-gray-600 lg:text-base"
          >
            Condiciones Activas
          </a>
        </nav>
      </div>
    </header>
  );
}
