import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportRowRaw = {
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

export const COLUMN_ORDER: Array<keyof ReportRowRaw> = [
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

export const NUMERIC_COLUMNS = [
  "PRESUPUESTO_VENTAS",
  "VENDIDO",
  "CLIENTES",
  "CLIENTES_ACTIVADOS",
  "PRESUPUESTO_COBROS",
  "COBRADO",
  "MARCAS_ACTIVADAS",
  "RENGLONES_IMPORTADOS",
  "RENGLONES_NACIONALES",
] as const;

export type NumericColumn = (typeof NUMERIC_COLUMNS)[number];
export type NumericTotals = Record<NumericColumn, number>;

export const ALL_OPTION = "__ALL__";
export const LEAF_COLUMN_COUNT = 13;

export function createEmptyTotals(): NumericTotals {
  return {
    PRESUPUESTO_VENTAS: 0,
    VENDIDO: 0,
    CLIENTES: 0,
    CLIENTES_ACTIVADOS: 0,
    PRESUPUESTO_COBROS: 0,
    COBRADO: 0,
    MARCAS_ACTIVADAS: 0,
    RENGLONES_IMPORTADOS: 0,
    RENGLONES_NACIONALES: 0,
  };
}

export function aggregateTotals(rows: ReportRowRaw[]): NumericTotals {
  return rows.reduce<NumericTotals>((acc, row) => {
    for (const column of NUMERIC_COLUMNS) {
      acc[column] += parseNumericValue(row[column]);
    }
    return acc;
  }, createEmptyTotals());
}

export function calculateAverageValue(
  rows: ReportRowRaw[],
  column: keyof ReportRowRaw,
): number {
  if (rows.length === 0) return 0;
  const total = rows.reduce(
    (acc, row) => acc + parseNumericValue(row[column]),
    0,
  );
  return total / rows.length;
}

export function parseNumericValue(value: string): number {
  const normalized = value.replace(/[^\d.-]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-VE").format(value);
}

export function formatInteger(value: number): string {
  return formatNumber(Math.round(value));
}

export function calculateCompliance(
  numerator: number,
  denominator: number,
): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toTitleCase(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .trim()
    .replace(/(^|[\s\-'])\S/g, (match) => match.toUpperCase());
}

export function buildExcelBuffer(rows: ReportRowRaw[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: COLUMN_ORDER });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

export function buildPdfBlob(rows: ReportRowRaw[], title: string): Blob {
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

export function triggerDownload(
  blob: Blob | ArrayBuffer,
  filename: string,
): void {
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
