"use client";

import { ReportProvider } from "../../context/report-context";
import Legend from "../../components/Legend";
import ConsolidatedSummary from "../../components/ConsolidatedSummary";
import BatchExport from "../../components/BatchExport";
import FiltersAndTable from "../../components/FiltersAndTable";

export default function DashboardPage() {
  return (
    <ReportProvider>
      <main className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:max-w-9xl lg:gap-6 lg:p-6">
        <Legend />
        <ConsolidatedSummary />
        <BatchExport />
        <FiltersAndTable />
      </main>
    </ReportProvider>
  );
}
