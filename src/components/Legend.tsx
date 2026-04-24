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
  const refDate = info?.ref ?? null;
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
          Datos hasta el {refDateStr}. <br className="lg:hidden" />
          Alcance actual: {mustPct}% del mes.
        </div>
      </div>
    </section>
  );
}
