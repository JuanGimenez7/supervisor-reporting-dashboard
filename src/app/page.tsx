"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import * as XLSX from "xlsx";

type ReportRowRaw = {
  SUPERVISOR: string;
  REGION: string;
  VENDEDOR: string;
  PRESUPUESTO_VENTAS: string;
  VENDIDO: string;
  CLIENTES: string;
  CLIENTES_ACTIVADOS: string;
  PRESUPUESTO_COBROS: string;
  COBRADO: string;
  MARCAS_ACTIVADAS: string;
  RENGLONES_IMPORTADOS: string;
  RENGLONES_NACIONALES: string;
};

type GroupByKey = "SUPERVISOR" | "VENDEDOR";

const COLUMN_ORDER: Array<keyof ReportRowRaw> = [
  "SUPERVISOR",
  "REGION",
  "VENDEDOR",
  "PRESUPUESTO_VENTAS",
  "VENDIDO",
  "CLIENTES",
  "CLIENTES_ACTIVADOS",
  "PRESUPUESTO_COBROS",
  "COBRADO",
  "MARCAS_ACTIVADAS",
  "RENGLONES_IMPORTADOS",
  "RENGLONES_NACIONALES",
];

const NUMERIC_COLUMNS: Array<keyof ReportRowRaw> = [
  "PRESUPUESTO_VENTAS",
  "VENDIDO",
  "CLIENTES",
  "CLIENTES_ACTIVADOS",
  "PRESUPUESTO_COBROS",
  "COBRADO",
  "MARCAS_ACTIVADAS",
  "RENGLONES_IMPORTADOS",
  "RENGLONES_NACIONALES",
];

const ALL_OPTION = "__ALL__";

function parseNumericValue(value: string): number {
  const normalized = value.replace(/[^\d.-]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-VE").format(value);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildExcelBuffer(rows: ReportRowRaw[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: COLUMN_ORDER });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

function buildPdfBlob(rows: ReportRowRaw[], title: string): Blob {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(11);
  doc.text(title, 14, 14);

  autoTable(doc, {
    startY: 18,
    head: [COLUMN_ORDER],
    body: rows.map((row) => COLUMN_ORDER.map((col) => row[col])),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [17, 24, 39] },
    margin: { left: 6, right: 6 },
  });

  return doc.output("blob");
}

function triggerDownload(blob: Blob | ArrayBuffer, filename: string): void {
  const downloadBlob =
    blob instanceof Blob
      ? blob
      : new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

  const url = URL.createObjectURL(downloadBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [rows, setRows] = useState<ReportRowRaw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisorFilter, setSupervisorFilter] = useState(ALL_OPTION);
  const [vendedorFilter, setVendedorFilter] = useState(ALL_OPTION);
  const [regionFilter, setRegionFilter] = useState(ALL_OPTION);
  const [searchText, setSearchText] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByKey>("SUPERVISOR");
  const [isExportingBatch, setIsExportingBatch] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const response = await fetch("/report.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar report.json");
        }
        const data = (await response.json()) as ReportRowRaw[];
        if (isMounted) {
          setRows(data);
        }
      } catch {
        if (isMounted) {
          setError(
            "No se pudo cargar el archivo report.json. Verifica que exista en /public."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const uniqueSupervisores = useMemo(
    () => [...new Set(rows.map((row) => row.SUPERVISOR))].sort(),
    [rows]
  );
  const uniqueVendedores = useMemo(
    () => [...new Set(rows.map((row) => row.VENDEDOR))].sort(),
    [rows]
  );
  const uniqueRegiones = useMemo(
    () => [...new Set(rows.map((row) => row.REGION))].sort(),
    [rows]
  );

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

      return matchesSupervisor && matchesVendedor && matchesRegion && matchesText;
    });
  }, [rows, supervisorFilter, vendedorFilter, regionFilter, searchText]);

  const totalVendido = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.VENDIDO),
        0
      ),
    [filteredRows]
  );
  const totalCobrado = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => acc + parseNumericValue(row.COBRADO),
        0
      ),
    [filteredRows]
  );

  function exportCurrentExcel() {
    const buffer = buildExcelBuffer(filteredRows);
    triggerDownload(buffer, "reporte-filtrado.xlsx");
  }

  function exportCurrentPdf() {
    const blob = buildPdfBlob(filteredRows, "Reporte filtrado");
    triggerDownload(blob, "reporte-filtrado.pdf");
  }

  async function exportBatch(format: "xlsx" | "pdf") {
    setIsExportingBatch(true);
    try {
      const zip = new JSZip();
      const grouped = new Map<string, ReportRowRaw[]>();

      for (const row of rows) {
        const key = row[groupBy];
        const groupRows = grouped.get(key) ?? [];
        groupRows.push(row);
        grouped.set(key, groupRows);
      }

      const today = new Date().toISOString().slice(0, 10);
      for (const [groupValue, groupRows] of grouped) {
        const safeName = `${groupBy.toLowerCase()}-${slugify(groupValue)}-${today}`;
        if (format === "xlsx") {
          zip.file(`${safeName}.xlsx`, buildExcelBuffer(groupRows));
        } else {
          const pdfBlob = buildPdfBlob(
            groupRows,
            `Reporte por ${groupBy}: ${groupValue}`
          );
          zip.file(`${safeName}.pdf`, pdfBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `reportes-${groupBy.toLowerCase()}-${format}.zip`);
    } finally {
      setIsExportingBatch(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-6">
        <p className="text-gray-700">Cargando reporte...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <header className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          Dashboard de Supervisión
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Filtra por supervisor, vendedor y región. Exporta el resultado actual o
          genera archivos por lote.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Filas visibles</p>
          <p className="text-2xl font-semibold text-gray-900">{filteredRows.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total vendido</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatNumber(totalVendido)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total cobrado</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatNumber(totalCobrado)}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Supervisor</span>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
              value={supervisorFilter}
              onChange={(event) => setSupervisorFilter(event.target.value)}
            >
              <option value={ALL_OPTION}>Todos</option>
              {uniqueSupervisores.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Vendedor</span>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
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

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Región</span>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
            >
              <option value={ALL_OPTION}>Todas</option>
              {uniqueRegiones.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Búsqueda rápida</span>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-800 placeholder:text-gray-500"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Supervisor, vendedor o región"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
            onClick={exportCurrentExcel}
            disabled={filteredRows.length === 0}
          >
            Exportar Excel (vista actual)
          </button>
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
            onClick={exportCurrentPdf}
            disabled={filteredRows.length === 0}
          >
            Exportar PDF (vista actual)
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setSupervisorFilter(ALL_OPTION);
              setVendedorFilter(ALL_OPTION);
              setRegionFilter(ALL_OPTION);
              setSearchText("");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="group-by">
            Exportación por lote:
          </label>
          <select
            id="group-by"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as GroupByKey)}
          >
            <option value="SUPERVISOR">Por supervisor</option>
            <option value="VENDEDOR">Por vendedor</option>
          </select>
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            onClick={() => exportBatch("xlsx")}
            disabled={isExportingBatch || rows.length === 0}
          >
            ZIP Excel
          </button>
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            onClick={() => exportBatch("pdf")}
            disabled={isExportingBatch || rows.length === 0}
          >
            ZIP PDF
          </button>
          {isExportingBatch && (
            <span className="text-sm text-gray-600">Generando ZIP...</span>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gray-900 text-white">
              <tr>
                {COLUMN_ORDER.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border border-gray-700 px-3 py-2 text-left font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-gray-500"
                    colSpan={COLUMN_ORDER.length}
                  >
                    Sin resultados para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr
                    key={`${row.SUPERVISOR}-${row.VENDEDOR}-${index}`}
                    className="odd:bg-white even:bg-gray-50"
                  >
                    {COLUMN_ORDER.map((column) => {
                      const value = row[column];
                      const isNumericColumn = NUMERIC_COLUMNS.includes(column);
                      return (
                        <td
                          key={`${column}-${index}`}
                          className="whitespace-nowrap border border-gray-200 px-3 py-2 text-gray-800"
                        >
                          {isNumericColumn
                            ? formatNumber(parseNumericValue(value))
                            : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
