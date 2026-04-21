"use client";

export default function Header() {
  return (
    <header className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
        Dashboard de Supervisores
      </h1>
      <div className="mt-3 flex flex-col gap-2 text-sm text-gray-700">
        <div className="font-medium">Leyenda del semáforo (Cumplimiento)</div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <span>
              Ventas / Cobros:{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-red-200 border border-red-200" />{" "}
              &lt; 60%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-yellow-200 border border-yellow-200" />{" "}
              60% - 89%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-green-200 border border-green-200" />{" "}
              ≥ 90%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Clientes:{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-red-200 border border-red-200" />{" "}
              &lt; 40%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-yellow-200 border border-yellow-200" />{" "}
              40% - 60%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-green-200 border border-green-200" />{" "}
              ≥ 60%,
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
