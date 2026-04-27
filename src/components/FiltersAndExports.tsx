"use client";

import { useMemo } from "react";
import { useReportContext } from "../context/report-context";
import {
  ALL_OPTION,
  ReportRowRaw,
  buildExcelBuffer,
  buildPdfBlob,
  triggerDownload,
} from "../lib/report-utils";

export default function FiltersAndExports() {
  const {
    rows,
    supervisorFilter,
    setSupervisorFilter,
    vendedorFilter,
    setVendedorFilter,
    regionFilter,
    setRegionFilter,
    searchText,
    setSearchText,
    expandedSupervisors,
    toggleAllSupervisors,
  } = useReportContext();

  const uniqueSupervisores = useMemo(
    () => [...new Set(rows.map((r) => r.SUPERVISOR))].sort(),
    [rows],
  );
  const uniqueVendedores = useMemo(
    () => [...new Set(rows.map((r) => r.VENDEDOR))].sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const text = (searchText || "").trim().toLowerCase();
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
  }, [rows, supervisorFilter, vendedorFilter, regionFilter, searchText]);

  const pivotRows = useMemo(() => {
    const supervisorMap = new Map<string, ReportRowRaw[]>();

    for (const row of filteredRows) {
      const supervisorRows = supervisorMap.get(row.SUPERVISOR) ?? [];
      supervisorRows.push(row);
      supervisorMap.set(row.SUPERVISOR, supervisorRows);
    }

    return Array.from(supervisorMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([supervisor, supervisorRows]) => {
        const vendors = supervisorRows
          .sort((a, b) => a.ZONA.localeCompare(b.ZONA))
          .map((row) => ({
            vendor: row.VENDEDOR,
            zona: row.ZONA,
            rows: [row],
            region: row.REGION,
          }));

        return {
          supervisor,
          vendors,
        };
      });
  }, [filteredRows]);

  const allCollapsed = useMemo(
    () =>
      pivotRows.length > 0 &&
      pivotRows.every((g) => !expandedSupervisors[g.supervisor]),
    [pivotRows, expandedSupervisors],
  );

  function handleToggleAll() {
    toggleAllSupervisors(pivotRows, allCollapsed);
  }

  function exportCurrentExcel() {
    const buffer = buildExcelBuffer(filteredRows);
    triggerDownload(buffer, "reporte-filtrado.xlsx");
  }

  function exportCurrentPdf() {
    const blob = buildPdfBlob(filteredRows, "Reporte filtrado");
    triggerDownload(blob, "reporte-filtrado.pdf");
  }

  return (
    <section className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm w-full">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <button
              type="button"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-100 lg:w-auto"
              onClick={handleToggleAll}
              disabled={pivotRows.length === 0}
            >
              {allCollapsed ? "Expandir todo" : "Colapsar todo"}
            </button>

            <label className="flex w-full items-center gap-2 text-xs lg:text-sm lg:w-auto">
              <span className="font-medium text-gray-700">Supervisor</span>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 lg:w-auto"
                value={supervisorFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setSupervisorFilter(value);
                  if (value === ALL_OPTION) {
                    localStorage.removeItem("dashboard_supervisor_param");
                  } else {
                    localStorage.setItem("dashboard_supervisor_param", value);
                  }
                  const url = new URL(window.location.href);
                  if (value === ALL_OPTION) {
                    url.searchParams.delete("supervisor");
                  } else {
                    url.searchParams.set("supervisor", value);
                  }
                  window.history.replaceState({}, "", url.toString());
                }}
              >
                <option value={ALL_OPTION}>Todos</option>
                {uniqueSupervisores.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex w-full items-center gap-2 text-xs lg:text-sm lg:w-auto">
              <span className="font-medium text-gray-700">Vendedor</span>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 lg:w-auto"
                value={vendedorFilter}
                onChange={(event) => setVendedorFilter(event.target.value)}
              >
                <option value={ALL_OPTION}>Todos</option>
                {uniqueVendedores.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-100 lg:w-auto"
              onClick={() => {
                setSupervisorFilter(ALL_OPTION);
                setVendedorFilter(ALL_OPTION);
                setRegionFilter(ALL_OPTION);
                setSearchText("");
                localStorage.removeItem("dashboard_supervisor_param");
                const url = new URL(window.location.href);
                url.searchParams.delete("supervisor");
                window.history.replaceState({}, "", url.toString());
              }}
            >
              Limpiar filtros
            </button>
          </div>

          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:w-auto">
            <button
              type="button"
              className="w-full rounded-md bg-gray-700 px-3 py-2 text-xs lg:text-sm font-medium text-gray-50 hover:bg-gray-800 lg:w-auto"
              onClick={exportCurrentExcel}
              disabled={filteredRows.length === 0}
            >
              Exportar Excel (vista actual)
            </button>
            <button
              type="button"
              className="w-full rounded-md bg-gray-700 px-3 py-2 text-xs lg:text-sm font-medium text-gray-50 hover:bg-gray-800 lg:w-auto"
              onClick={exportCurrentPdf}
              disabled={filteredRows.length === 0}
            >
              Exportar PDF (vista actual)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
