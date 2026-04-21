"use client";

export default function Header() {
  return (
    <header className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
        Dashboard de Supervisores
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Filtra por supervisor y vendedor. Exporta el resultado actual o genera
        archivos por lote.
      </p>
    </header>
  );
}
