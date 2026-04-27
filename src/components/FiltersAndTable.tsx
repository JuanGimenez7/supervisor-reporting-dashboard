"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useReportContext } from "../context/report-context";
import {
  aggregateTotals,
  calculateAverageValue,
  formatNumber,
  formatInteger,
  formatPercent,
  calculateCompliance,
  buildExcelBuffer,
  buildPdfBlob,
  buildVendorPdfBlob,
  triggerDownload,
  LEAF_COLUMN_COUNT,
  ALL_OPTION,
  ReportRowRaw,
  NumericTotals,
} from "../lib/report-utils";
import { getSemaforoEmoji } from "../lib/semaforo";

export default function FiltersAndTable() {
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
  } = useReportContext();

  const [expandedSupervisors, setExpandedSupervisors] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const supervisorParam = params.get("supervisor");
    return supervisorParam ? { [supervisorParam]: true } : {};
  });

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
            totals: aggregateTotals([row]),
            promedioMarcasActivadas: calculateAverageValue(
              [row],
              "MARCAS_ACTIVADAS",
            ),
          }));

        return {
          supervisor,
          totals: aggregateTotals(supervisorRows),
          promedioMarcasActivadas: calculateAverageValue(
            supervisorRows,
            "MARCAS_ACTIVADAS",
          ),
          vendors,
        };
      });
  }, [filteredRows]);

  const [selectedVendor, setSelectedVendor] = useState<{
    vendor: string;
    zona: string;
    supervisor: string;
    region: string;
    rows: ReportRowRaw[];
    totals: NumericTotals;
    promedioMarcasActivadas: number;
  } | null>(null);

  function closeVendorModal() {
    setSelectedVendor(null);
  }

  const scrollYRef = useRef<number | null>(null);
  const prevBodyStyleRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedVendor) {
      prevBodyStyleRef.current = {
        position: document.body.style.position || "",
        top: document.body.style.top || "",
        left: document.body.style.left || "",
        right: document.body.style.right || "",
        overflow: document.body.style.overflow || "",
        width: document.body.style.width || "",
      };

      scrollYRef.current = window.scrollY || window.pageYOffset || 0;

      // Lock scroll on background
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      const prev = prevBodyStyleRef.current;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      document.body.classList.remove("modal-open");
      if (scrollYRef.current !== null) {
        window.scrollTo(0, scrollYRef.current);
        scrollYRef.current = null;
      }
    }

    return () => {
      const prev = prevBodyStyleRef.current;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      document.body.classList.remove("modal-open");
      if (scrollYRef.current !== null) {
        window.scrollTo(0, scrollYRef.current);
        scrollYRef.current = null;
      }
    };
  }, [selectedVendor]);

  function exportVendorExcel(vendorRows: ReportRowRaw[], vendorName: string) {
    const buffer = buildExcelBuffer(vendorRows);
    const safeName = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    triggerDownload(buffer, `vendedor-${safeName}.xlsx`);
  }

  function exportVendorPdf(
    vendorRows: ReportRowRaw[],
    vendorName: string,
    supervisor?: string,
    region?: string,
  ) {
    const blob = buildVendorPdfBlob({
      rows: vendorRows,
      vendorName,
      supervisor,
      region,
    });
    const safeName = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    triggerDownload(blob, `vendedor-${safeName}.pdf`);
  }

  function toggleSupervisor(supervisor: string) {
    setExpandedSupervisors((current) => ({
      ...current,
      [supervisor]: !current[supervisor],
    }));
  }

  const allCollapsed = useMemo(
    () =>
      pivotRows.length > 0 &&
      pivotRows.every((g) => !expandedSupervisors[g.supervisor]),
    [pivotRows, expandedSupervisors],
  );

  function toggleAllSupervisors() {
    setExpandedSupervisors(() => {
      const nextValue = allCollapsed;
      return pivotRows.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.supervisor] = nextValue;
        return acc;
      }, {});
    });
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
              onClick={toggleAllSupervisors}
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
                    // Also update URL
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
                   // Also update URL
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
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-collapse text-[0.68rem] lg:text-xs">
             <thead className="sticky top-0 z-20 bg-white text-black">
            <tr>
              <th
                rowSpan={2}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-left font-semibold"
              >
                SUPERVISOR / VENDEDOR
              </th>
              <th
                rowSpan={2}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                ZONA
              </th>
              <th
                colSpan={3}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                VENTAS
              </th>
              <th
                colSpan={3}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                CLIENTES
              </th>
              <th
                colSpan={3}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                COBROS
              </th>
              <th
                colSpan={1}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                MARCAS
              </th>
              <th
                colSpan={3}
                className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold"
              >
                RENGLONES
              </th>
            </tr>
            <tr>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                PRESUPUESTO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                VENDIDO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                CUMPLIDO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                CARTERA
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                ACTIVADOS
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                CUMPLIDO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                PRESUPUESTO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                COBRADO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                CUMPLIDO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                PROMEDIO
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                TOTAL
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                IMPORTADOS
              </th>
              <th className="whitespace-nowrap border border-gray-700 px-3 py-2 text-center font-semibold">
                NACIONALES
              </th>
            </tr>
          </thead>
          <tbody>
            {pivotRows.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-gray-500"
                  colSpan={LEAF_COLUMN_COUNT}
                >
                  Sin resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              pivotRows.flatMap((group) => {
                const isExpanded =
                  expandedSupervisors[group.supervisor] === true;

                const ventasCumplidoSuper = calculateCompliance(
                  group.totals.VENDIDO,
                  group.totals.PRESUPUESTO_VENTAS,
                );
                const clientesCumplidoSuper = calculateCompliance(
                  group.totals.CLIENTES_ACTIVADOS,
                  group.totals.CARTERA_CLIENTES,
                );
                const cobrosCumplidoSuper = calculateCompliance(
                  group.totals.COBRADO,
                  group.totals.PRESUPUESTO_COBROS,
                );

                 const supervisorRow = (
                   <tr key={`group-${group.supervisor}`} className="bg-gray-100">
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 font-semibold text-gray-900">
                       <button
                         type="button"
                         className="inline-flex items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-200"
                         onClick={() => toggleSupervisor(group.supervisor)}
                         aria-label={
                           isExpanded
                             ? `Ocultar vendedores de ${group.supervisor}`
                             : `Mostrar vendedores de ${group.supervisor}`
                         }
                       >
                         <span className="inline-block w-4 text-center">
                           {isExpanded ? "−" : "+"}
                         </span>
                         <span>{group.supervisor}</span>
                       </button>
                     </td>
                      <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-center font-semibold text-gray-900">
                        –
                      </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.PRESUPUESTO_VENTAS)}
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.VENDIDO)}
                     </td>
                      <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                          <span className="flex items-center justify-between gap-1">
                          <span>{getSemaforoEmoji("ventas", ventasCumplidoSuper)}</span>
                          <span>{formatPercent(ventasCumplidoSuper)}</span>
                        </span>
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.CARTERA_CLIENTES)}
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.CLIENTES_ACTIVADOS)}
                     </td>
                      <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                        <span className="flex items-center justify-between gap-1">
                          <span>{getSemaforoEmoji("clientes", clientesCumplidoSuper)}</span>
                          <span>{formatPercent(clientesCumplidoSuper)}</span>
                        </span>
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.PRESUPUESTO_COBROS)}
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.COBRADO)}
                     </td>
                      <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                        <span className="flex items-center justify-between gap-1">
                          <span>{getSemaforoEmoji("cobros", cobrosCumplidoSuper)}</span>
                          <span>{formatPercent(cobrosCumplidoSuper)}</span>
                        </span>
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatInteger(group.promedioMarcasActivadas)}
                     </td>
                      <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                            <span className="flex items-center justify-between gap-1">
                            <span>{getSemaforoEmoji("renglones", group.vendors.length > 0 ? (group.vendors.reduce((sum, v) => sum + v.totals.RENGLONES_IMPORTADOS + v.totals.RENGLONES_NACIONALES, 0) / group.vendors.length) : 0)}</span>
                            <span>{formatNumber(
                              group.totals.RENGLONES_IMPORTADOS +
                                group.totals.RENGLONES_NACIONALES,
                            )}</span>
                          </span>
                       </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.RENGLONES_IMPORTADOS)}
                     </td>
                     <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                       {formatNumber(group.totals.RENGLONES_NACIONALES)}
                     </td>
                   </tr>
                 );

                if (!isExpanded) return [supervisorRow];

                const vendorRows = group.vendors.map(
                  (vendorGroup: {
                    vendor: string;
                    zona: string;
                    rows: ReportRowRaw[];
                    region: string;
                    totals: NumericTotals;
                    promedioMarcasActivadas: number;
                  }) => {
                    const ventasCumplidoVendor = calculateCompliance(
                      vendorGroup.totals.VENDIDO,
                      vendorGroup.totals.PRESUPUESTO_VENTAS,
                    );
                    const clientesCumplidoVendor = calculateCompliance(
                      vendorGroup.totals.CLIENTES_ACTIVADOS,
                      vendorGroup.totals.CARTERA_CLIENTES,
                    );
                    const cobrosCumplidoVendor = calculateCompliance(
                      vendorGroup.totals.COBRADO,
                      vendorGroup.totals.PRESUPUESTO_COBROS,
                    );

                    return (
                      <tr
                        key={`vendor-${group.supervisor}-${vendorGroup.vendor}-${vendorGroup.zona}`}
                        className="bg-white hover:bg-slate-50 cursor-pointer"
                        onClick={() =>
                          setSelectedVendor({
                            vendor: vendorGroup.vendor,
                            zona: vendorGroup.zona,
                            supervisor: group.supervisor,
                            region: vendorGroup.region,
                            rows: vendorGroup.rows,
                            totals: vendorGroup.totals,
                            promedioMarcasActivadas:
                              vendorGroup.promedioMarcasActivadas,
                          })
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedVendor({
                              vendor: vendorGroup.vendor,
                              zona: vendorGroup.zona,
                              supervisor: group.supervisor,
                              region: vendorGroup.region,
                              rows: vendorGroup.rows,
                              totals: vendorGroup.totals,
                              promedioMarcasActivadas:
                                vendorGroup.promedioMarcasActivadas,
                            });
                          }
                        }}
                      >
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 pl-10 text-gray-800">
                          {vendorGroup.vendor}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-center text-gray-800">
                          {vendorGroup.zona}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.PRESUPUESTO_VENTAS)}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.VENDIDO)}
                        </td>
                         <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                           <span className="flex items-center justify-between gap-1">
                             <span>{getSemaforoEmoji("ventas", ventasCumplidoVendor)}</span>
                             <span>{formatPercent(ventasCumplidoVendor)}</span>
                           </span>
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.CARTERA_CLIENTES)}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.CLIENTES_ACTIVADOS)}
                        </td>
                         <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                           <span className="flex items-center justify-between gap-1">
                             <span>{getSemaforoEmoji("clientes", clientesCumplidoVendor)}</span>
                             <span>{formatPercent(clientesCumplidoVendor)}</span>
                           </span>
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.PRESUPUESTO_COBROS)}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(vendorGroup.totals.COBRADO)}
                        </td>
                         <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                           <span className="flex items-center justify-between gap-1">
                             <span>{getSemaforoEmoji("cobros", cobrosCumplidoVendor)}</span>
                             <span>{formatPercent(cobrosCumplidoVendor)}</span>
                           </span>
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatInteger(vendorGroup.promedioMarcasActivadas)}
                        </td>
                         <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                              <span className="flex items-center justify-between gap-1">
                              <span>{getSemaforoEmoji("renglones", vendorGroup.totals.RENGLONES_IMPORTADOS + vendorGroup.totals.RENGLONES_NACIONALES)}</span>
                              <span>{formatNumber(
                                vendorGroup.totals.RENGLONES_IMPORTADOS +
                                  vendorGroup.totals.RENGLONES_NACIONALES,
                              )}</span>
                            </span>
                         </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(
                            vendorGroup.totals.RENGLONES_IMPORTADOS,
                          )}
                        </td>
                        <td className="whitespace-nowrap border border-gray-200 px-3 py-2 text-right text-gray-800">
                          {formatNumber(
                            vendorGroup.totals.RENGLONES_NACIONALES,
                          )}
                        </td>
                      </tr>
                    );
                  },
                );

                return [supervisorRow, ...vendorRows];
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 modal-overlay"
            onClick={closeVendorModal}
          />
          <div className="relative w-auto max-w-[540px] rounded border border-gray-300 bg-white p-6 shadow-lg modal-content">
            <button
              className="absolute top-4 right-4 rounded bg-gray-700 px-2 py-1 text-xs lg:text-sm font-medium text-white hover:bg-gray-800"
              onClick={closeVendorModal}
              aria-label="Cerrar"
            >
              Cerrar
            </button>

            <div>
              <h3 className="text-base lg:text-lg font-semibold text-slate-700">
                {selectedVendor.vendor}
              </h3>
              <div className="text-sm text-gray-500">
                Zona: {selectedVendor.rows[0]?.ZONA} | Región: {selectedVendor.region}
              </div>
            </div>

            <div className="mt-4">
              <div className="space-y-4">
                {/* Ventas */}
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Ventas
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Presupuesto
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.PRESUPUESTO_VENTAS)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Vendido
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.VENDIDO)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Cumplimiento
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatPercent(
                          calculateCompliance(
                            selectedVendor.totals.VENDIDO,
                            selectedVendor.totals.PRESUPUESTO_VENTAS,
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clientes */}
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Clientes
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Cartera
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.CARTERA_CLIENTES)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Activados
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.CLIENTES_ACTIVADOS)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Cumplimiento
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatPercent(
                          calculateCompliance(
                            selectedVendor.totals.CLIENTES_ACTIVADOS,
                            selectedVendor.totals.CARTERA_CLIENTES,
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cobros */}
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Cobros
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Presupuesto
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.PRESUPUESTO_COBROS)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Cobrado
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(selectedVendor.totals.COBRADO)}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Cumplimiento
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatPercent(
                          calculateCompliance(
                            selectedVendor.totals.COBRADO,
                            selectedVendor.totals.PRESUPUESTO_COBROS,
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renglones */}
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Renglones
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Total
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(
                          selectedVendor.totals.RENGLONES_IMPORTADOS +
                            selectedVendor.totals.RENGLONES_NACIONALES,
                        )}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Importados
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(
                          selectedVendor.totals.RENGLONES_IMPORTADOS,
                        )}
                      </div>
                    </div>
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Nacionales
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatNumber(
                          selectedVendor.totals.RENGLONES_NACIONALES,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marcas */}
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-slate-700 mb-2">
                    Marcas
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-white p-4">
                      <div className="text-[0.68rem] lg:text-xs text-gray-500">
                        Total
                      </div>
                      <div className="mt-2 text-xl lg:text-2xl font-semibold text-slate-700">
                        {formatInteger(selectedVendor.promedioMarcasActivadas)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                className="rounded bg-gray-700 px-3 py-2 text-xs lg:text-sm font-medium text-white hover:bg-gray-800"
                onClick={() =>
                  exportVendorPdf(
                    selectedVendor.rows,
                    selectedVendor.vendor,
                    selectedVendor.supervisor,
                    selectedVendor.region,
                  )
                }
              >
                Descargar PDF
              </button>
              <button
                type="button"
                className="rounded bg-gray-700 px-3 py-2 text-xs lg:text-sm font-medium text-white hover:bg-gray-800"
                onClick={() =>
                  exportVendorExcel(selectedVendor.rows, selectedVendor.vendor)
                }
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
