"use client";

import { useState } from "react";
import JSZip from "jszip";
import { useReportContext } from "../context/report-context";
import {
  buildExcelBuffer,
  buildPdfBlob,
  triggerDownload,
  slugify,
  ReportRowRaw,
} from "../lib/report-utils";

type GroupByKey = "SUPERVISOR" | "VENDEDOR";

export default function BatchExport() {
  const { rows } = useReportContext();
  const [groupBy, setGroupBy] = useState<GroupByKey>("SUPERVISOR");
  const [isExportingBatch, setIsExportingBatch] = useState(false);

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
            `Reporte por ${groupBy}: ${groupValue}`,
          );
          zip.file(`${safeName}.pdf`, pdfBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(
        zipBlob,
        `reportes-${groupBy.toLowerCase()}-${format}.zip`,
      );
    } finally {
      setIsExportingBatch(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="group-by">
          Exportación por lote:
        </label>
        <select
          id="group-by"
          className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800"
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as GroupByKey)}
        >
          <option value="SUPERVISOR">Por supervisor</option>
          <option value="VENDEDOR">Por vendedor</option>
        </select>
        <button
          type="button"
          className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-50 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          onClick={() => exportBatch("xlsx")}
          disabled={isExportingBatch || rows.length === 0}
        >
          ZIP Excel
        </button>
        <button
          type="button"
          className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-50 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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
  );
}
