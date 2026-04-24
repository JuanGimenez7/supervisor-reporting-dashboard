import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportRowRaw = {
  SUPERVISOR: string;
  REGION: string;
  VENDEDOR: string;
  PRESUPUESTO_VENTAS: string;
  VENDIDO: string;
  CARTERA_CLIENTES: string;
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
  "CARTERA_CLIENTES",
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
  "CARTERA_CLIENTES",
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
export const LEAF_COLUMN_COUNT = 14;

export function createEmptyTotals(): NumericTotals {
  return {
    PRESUPUESTO_VENTAS: 0,
    VENDIDO: 0,
    CARTERA_CLIENTES: 0,
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
    headStyles: { fillColor: [39, 39, 39] },
    margin: { left: 6, right: 6 },
  });

  return doc.output("blob");
}

export function buildVendorPdfBlob(params: {
  rows: ReportRowRaw[];
  vendorName: string;
  supervisor?: string;
  region?: string;
}): Blob {
  const { rows, vendorName, supervisor, region } = params;

  const totals = aggregateTotals(rows);
  const promedioMarcas = calculateAverageValue(rows, "MARCAS_ACTIVADAS");
  const sup = supervisor ?? rows[0]?.SUPERVISOR ?? "";
  const reg = region ?? rows[0]?.REGION ?? "";

  const doc = new jsPDF({ orientation: "portrait" });
  doc.setFontSize(12);
  doc.text(vendorName, 14, 14);
  // show supervisor and region under the title
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Supervisor: ${sup}   Región: ${reg}`, 14, 20);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const marginY = 12;
  const contentWidth = pageWidth - marginX * 2;
  const colGap = 4;
  const baseColWidth = (contentWidth - colGap * 2) / 4;
  const titleAreaHeight = 20;
  // 5 groups now: Ventas, Clientes, Cobros, Renglones, Marcas
  const groupsCount = 5;
  const sectionGap = 4;
  const availableHeight = pageHeight - marginY - titleAreaHeight - marginY;
  const perGroupBlock = Math.floor((availableHeight - sectionGap * (groupsCount - 1)) / groupsCount);
  const titleHeight = 10;
  const cardHeight = perGroupBlock - titleHeight - 20;
  let currentY = marginY + titleAreaHeight;

  const totalRenglones = totals.RENGLONES_IMPORTADOS + totals.RENGLONES_NACIONALES;

  const groups = [
    {
      title: "Ventas",
      metrics: [
        { label: "Presupuesto", value: formatNumber(totals.PRESUPUESTO_VENTAS) },
        { label: "Vendido", value: formatNumber(totals.VENDIDO) },
        { label: "Cumplimiento", value: formatPercent(calculateCompliance(totals.VENDIDO, totals.PRESUPUESTO_VENTAS)) },
      ],
    },
    {
      title: "Clientes",
      metrics: [
        { label: "Cartera", value: formatNumber(totals.CARTERA_CLIENTES) },
        { label: "Activados", value: formatNumber(totals.CLIENTES_ACTIVADOS) },
        { label: "Cumplimiento", value: formatPercent(calculateCompliance(totals.CLIENTES_ACTIVADOS, totals.CARTERA_CLIENTES)) },
      ],
    },
    {
      title: "Cobros",
      metrics: [
        { label: "Presupuesto", value: formatNumber(totals.PRESUPUESTO_COBROS) },
        { label: "Cobrado", value: formatNumber(totals.COBRADO) },
        { label: "Cumplimiento", value: formatPercent(calculateCompliance(totals.COBRADO, totals.PRESUPUESTO_COBROS)) },
      ],
    },
    {
      title: "Renglones",
      metrics: [
        { label: "Total", value: formatNumber(totalRenglones) },
        { label: "Importados", value: formatNumber(totals.RENGLONES_IMPORTADOS) },
        { label: "Nacionales", value: formatNumber(totals.RENGLONES_NACIONALES) },
      ],
    },
    {
      title: "Marcas",
      metrics: [
        { label: "Total", value: formatInteger(promedioMarcas) },
      ],
    },
  ];

  const cellGap = 0;
  const rowHeight = (cardHeight - cellGap) / 2.5;

  for (const group of groups) {
    // section title
    doc.setFontSize(10);
    doc.setTextColor(55, 55, 55);
    doc.setFont("helvetica", "bold");
    doc.text(group.title, marginX, currentY + 6);
    doc.setFont("helvetica", "normal");

    const cardY = currentY + titleHeight;
    const metricsCount = group.metrics.length;
    
    if (metricsCount === 1) {
      // single card aligned left (same size as other cards)
      doc.setDrawColor(220);
      doc.setLineWidth(0.35);
      doc.rect(marginX, cardY, baseColWidth, cardHeight);

      const labelY = cardY + rowHeight / 2 + 4;
      const valueY = cardY + rowHeight + cellGap + rowHeight / 2 + 3;
      const centerX = marginX + baseColWidth / 2;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(group.metrics[0].label, centerX, labelY, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(33);
      doc.setFont("helvetica", "bold");
      doc.text(String(group.metrics[0].value), centerX, valueY, { align: "center" });
      doc.setFont("helvetica", "normal");
    } else {
      // three cards for other groups
      for (let i = 0; i < 3; i++) {
        const x = marginX + i * (baseColWidth + colGap);
        doc.setDrawColor(220);
        doc.setLineWidth(0.35);
        doc.rect(x, cardY, baseColWidth, cardHeight);

        const labelY = cardY + rowHeight / 2 + 4;
        const valueY = cardY + rowHeight + cellGap + rowHeight / 2 + 3;
        const centerX = x + baseColWidth / 2;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(group.metrics[i].label, centerX, labelY, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(33);
        doc.setFont("helvetica", "bold");
        doc.text(String(group.metrics[i].value), centerX, valueY, { align: "center" });
        doc.setFont("helvetica", "normal");
      }
    }

    currentY = cardY + cardHeight + sectionGap;
  }

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
