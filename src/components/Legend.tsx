"use client";

import { useEffect, useState } from "react";
import { computeMustInfo } from "../lib/semaforo";

export default function Legend() {
  const [info, setInfo] = useState<{
    must: number;
    elapsedWorking: number;
    totalWorking: number;
    ref: Date;
  } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setInfo(computeMustInfo()), 0);
    return () => clearTimeout(id);
  }, []);

  const must = info?.must ?? 0;

  const fmt = (n: number) => `${Math.round(n)}%`;

  const ventasYellow = 60 * must;
  const ventasGreen = 90 * must;
  const clientesYellow = 40 * must;
  const clientesGreen = 60 * must;

  const refDate = info?.ref ?? null;
  const elapsedWorking = info?.elapsedWorking ?? 0;
  const totalWorking = info?.totalWorking ?? 0;
  const mustPct = Math.round(must * 100);

  const formatDateDMY = (d: Date | null) => {
    if (!d) return "—";
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const refDateStr = formatDateDMY(refDate);

  return (
    <section
      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
      aria-label="Leyenda del semáforo"
    >
      <h1 className="text-lg font-bold text-gray-900 lg:text-2xl">
        Seguimiento de Gestión de Supervisores
      </h1>
      <div className="mt-3 text-xs lg:text-sm text-gray-700">
        <div className="mt-2 text-sm text-gray-600">
          Datos hasta el {refDateStr} / {mustPct}% del mes.
        </div>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:gap-6">
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <span>
              Ventas / Cobros:
              <br />
              <span className="inline-block h-4 w-6 rounded-sm bg-red-200 border border-red-200" />{" "}
              &lt; {fmt(ventasYellow)},{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-yellow-200 border border-yellow-200" />{" "}
              {fmt(ventasYellow)} - {fmt(ventasGreen)},{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-green-200 border border-green-200" />{" "}
              ≥ {fmt(ventasGreen)}
            </span>
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <span>
              Clientes:
              <br />
              <span className="inline-block h-4 w-6 rounded-sm bg-red-200 border border-red-200" />{" "}
              &lt; {fmt(clientesYellow)},{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-yellow-200 border border-yellow-200" />{" "}
              {fmt(clientesYellow)} - {fmt(clientesGreen)},{" "}
              <span className="inline-block h-4 w-6 rounded-sm bg-green-200 border border-green-200" />{" "}
              ≥ {fmt(clientesGreen)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
