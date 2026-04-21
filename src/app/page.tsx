"use client";

import { ReportProvider } from "../context/report-context";
import Header from "../components/Header";
import ConsolidatedSummary from "../components/ConsolidatedSummary";
import BatchExport from "../components/BatchExport";
import FiltersAndTable from "../components/FiltersAndTable";

export default function Home() {
  return (
    <ReportProvider>
      <main className="mx-auto flex min-h-screen w-full max-w-9xl flex-col gap-4 p-4 md:p-6">
        <Header />
        <ConsolidatedSummary />
        <BatchExport />
        <FiltersAndTable />
      </main>
    </ReportProvider>
  );
}
