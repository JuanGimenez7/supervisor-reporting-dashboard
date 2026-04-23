"use client";

export default function Header() {
  return (
    <header className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">
        Seguimiento de Gestión de Supervisores ∞
      </h1>
      <div className="mt-3 text-sm text-gray-700">
        <div className="font-medium">Leyenda del semáforo (Cumplimiento)</div>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:gap-6">
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <span>
              Ventas / Cobros:<br />
              <span className="inline-block h-4 w-6 rounded-sm bg-red-200 border border-red-200" />{" "}
              &lt; 60%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-yellow-200 border border-yellow-200" />{" "}
              60% - 89%,{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-green-200 border border-green-200" />{" "}
              ≥ 90%
            </span>
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <span>
              Clientes:<br />
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
