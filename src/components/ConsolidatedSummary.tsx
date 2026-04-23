"use client";

import { useMemo } from "react";
import { useReportContext } from "../context/report-context";
import {
  parseNumericValue,
  calculateCompliance,
  calculateAverageValue,
  formatNumber,
  formatInteger,
  formatPercent,
} from "../lib/report-utils";
import { getSemaforoClass } from "../lib/semaforo";

export default function ConsolidatedSummary() {
  const {
    rows,
    supervisorFilter,
    vendedorFilter,
    regionFilter,
    searchText,
    ALL_OPTION,
  } = useReportContext();

  const filteredRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSupervisor =
        supervisorFilter === ALL_OPTION || row.SUPERVISOR === supervisorFilter;
      const matchesVendedor =
        vendedorFilter === ALL_OPTION || row.VENDEDOR === vendedorFilter;
      const matchesRegion =
        regionFilter === ALL_OPTION || row.REGION === regionFilter;
      const matchesText =
        text.length === 0 ||
        row.SUPERVISOR.toLowerCase().includes(text) ||
        row.VENDEDOR.toLowerCase().includes(text) ||
        row.REGION.toLowerCase().includes(text);

      return (
        matchesSupervisor && matchesVendedor && matchesRegion && matchesText
      );
    });
  }, [
    rows,
    supervisorFilter,
    vendedorFilter,
    regionFilter,
    searchText,
    ALL_OPTION,
  ]);

  const totalPresupuestoVentas = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.PRESUPUESTO_VENTAS),
        0,
      ),
    [filteredRows],
  );

  const totalVendido = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.VENDIDO),
        0,
      ),
    [filteredRows],
  );

  const percentVentasCumplidas = useMemo(
    () => calculateCompliance(totalVendido, totalPresupuestoVentas),
    [totalVendido, totalPresupuestoVentas],
  );

  const totalClientes = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.CARTERA_CLIENTES),
        0,
      ),
    [filteredRows],
  );

  const totalClientesActivados = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.CLIENTES_ACTIVADOS),
        0,
      ),
    [filteredRows],
  );

  const percentClientesActivados = useMemo(
    () => calculateCompliance(totalClientesActivados, totalClientes),
    [totalClientesActivados, totalClientes],
  );

  const totalPresupuestoCobros = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.PRESUPUESTO_COBROS),
        0,
      ),
    [filteredRows],
  );

  const totalCobrado = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.COBRADO),
        0,
      ),
    [filteredRows],
  );

  const percentCobrosCumplidas = useMemo(
    () => calculateCompliance(totalCobrado, totalPresupuestoCobros),
    [totalCobrado, totalPresupuestoCobros],
  );

  const avgMarcasActivadas = useMemo(
    () => calculateAverageValue(filteredRows, "MARCAS_ACTIVADAS"),
    [filteredRows],
  );

  const totalRenglonesImportados = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.RENGLONES_IMPORTADOS),
        0,
      ),
    [filteredRows],
  );

  const totalRenglonesNacionales = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.RENGLONES_NACIONALES),
        0,
      ),
    [filteredRows],
  );

  return (
    <section className="space-y-3">
      {/* Group 1: Ventas */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="text-lg">💰</span>
          <span>Ventas</span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Presupuesto</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(totalPresupuestoVentas)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Vendido</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(totalVendido)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cumplimiento</p>
            <div
              className={`mt-1 inline-flex items-center gap-3 rounded px-2 py-1 ${getSemaforoClass(
                "ventas",
                percentVentasCumplidas,
              )}`}
            >
              <p className="text-2xl font-semibold text-gray-900 m-0">
                {formatPercent(percentVentasCumplidas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Clientes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="text-lg">👥</span>
          <span>Clientes</span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cartera</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatInteger(totalClientes)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Activados</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatInteger(totalClientesActivados)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cumplimiento</p>
            <div
              className={`mt-1 inline-flex items-center gap-3 rounded px-2 py-1 ${getSemaforoClass(
                "clientes",
                percentClientesActivados,
              )}`}
            >
              <p className="text-2xl font-semibold text-gray-900 m-0">
                {formatPercent(percentClientesActivados)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Cobros */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="text-lg">💵</span>
          <span>Cobros</span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Presupuesto</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(totalPresupuestoCobros)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cobrado</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(totalCobrado)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cumplimiento</p>
            <div
              className={`mt-1 inline-flex items-center gap-3 rounded px-2 py-1 ${getSemaforoClass(
                "cobros",
                percentCobrosCumplidas,
              )}`}
            >
              <p className="text-2xl font-semibold text-gray-900 m-0">
                {formatPercent(percentCobrosCumplidas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group 4: Marcas y Renglones */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="text-lg">📦</span>
          <span>Marcas / Renglones</span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Promedio de Marcas</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatInteger(avgMarcasActivadas)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Renglones Importados</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatInteger(totalRenglonesImportados)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Renglones Nacionales</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatInteger(totalRenglonesNacionales)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
