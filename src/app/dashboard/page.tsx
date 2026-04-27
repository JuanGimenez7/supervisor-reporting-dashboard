"use client";

import { useEffect } from "react";
import { ReportProvider } from "../../context/report-context";
import Legend from "../../components/Legend";
import ConsolidatedSummary from "../../components/ConsolidatedSummary";
import BatchExport from "../../components/BatchExport";
import FiltersAndTable from "../../components/FiltersAndTable";

export default function DashboardPage() {
  // Leer el parámetro de URL sincrónicamente antes del primer render
  let initialSupervisorFilter;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const supervisorParam = params.get("supervisor");
    if (supervisorParam) {
      localStorage.setItem("dashboard_supervisor_param", supervisorParam);
      initialSupervisorFilter = supervisorParam;
    } else {
      localStorage.removeItem("dashboard_supervisor_param");
    }
  }

  useEffect(() => {
    // Mantener sincronizado en navegaciones del lado del cliente
    const params = new URLSearchParams(window.location.search);
    const supervisorParam = params.get("supervisor");
    if (supervisorParam) {
      localStorage.setItem("dashboard_supervisor_param", supervisorParam);
    } else {
      localStorage.removeItem("dashboard_supervisor_param");
    }
  }, []);

  return (
    <ReportProvider initialSupervisorFilter={initialSupervisorFilter}>
      <main className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:max-w-9xl lg:gap-6 lg:p-6">
        <Legend />
        <ConsolidatedSummary />
        <BatchExport />
        <FiltersAndTable />
      </main>
    </ReportProvider>
  );
}
