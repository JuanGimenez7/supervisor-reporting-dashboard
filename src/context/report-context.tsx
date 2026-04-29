"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReportRowRaw } from "../lib/report-utils";
import { ALL_OPTION } from "../lib/report-utils";

type ReportContextValue = {
  rows: ReportRowRaw[];
  isLoading: boolean;
  error: string | null;
  supervisorFilter: string;
  setSupervisorFilter: (v: string) => void;
  vendedorFilter: string;
  setVendedorFilter: (v: string) => void;
  regionFilter: string;
  setRegionFilter: (v: string) => void;
  searchText: string;
  setSearchText: (v: string) => void;
  ALL_OPTION: string;
  expandedSupervisors: Record<string, boolean>;
  setExpandedSupervisors: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  toggleAllSupervisors: (pivotRows: Array<{ supervisor: string }>, allCollapsed: boolean) => void;
};

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export function ReportProvider({ children, initialSupervisorFilter }: { children: React.ReactNode; initialSupervisorFilter?: string }) {
  const [rows, setRows] = useState<ReportRowRaw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supervisorFilter, setSupervisorFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const param = localStorage.getItem("dashboard_supervisor_param");
      if (param) return param;
    }
    return initialSupervisorFilter || ALL_OPTION;
  });
  const [vendedorFilter, setVendedorFilter] = useState(ALL_OPTION);
  const [regionFilter, setRegionFilter] = useState(ALL_OPTION);
  const [searchText, setSearchText] = useState("");
  const [expandedSupervisors, setExpandedSupervisors] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const supervisorParam = params.get("supervisor");
    return supervisorParam ? { [supervisorParam]: true } : {};
  });

  function toggleAllSupervisors(pivotRows: Array<{ supervisor: string }>, allCollapsed: boolean) {
    const nextValue = allCollapsed;
    setExpandedSupervisors(() =>
      pivotRows.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.supervisor] = nextValue;
        return acc;
      }, {}),
    );
  }

  useEffect(() => {
    let isMounted = true;
    const report = "report-28-04.json";

    async function loadData() {
      try {
        const response = await fetch(`/${report}`);
        if (!response.ok) throw new Error(`No se pudo cargar ${report}`);
        const data = (await response.json()) as ReportRowRaw[];
        if (isMounted) setRows(data);
      } catch {
        if (isMounted)
          setError(
            `No se pudo cargar el archivo ${report}. Verifica que exista en /public.`,
          );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: ReportContextValue = {
    rows,
    isLoading,
    error,
    supervisorFilter,
    setSupervisorFilter,
    vendedorFilter,
    setVendedorFilter,
    regionFilter,
    setRegionFilter,
    searchText,
    setSearchText,
    ALL_OPTION,
    expandedSupervisors,
    setExpandedSupervisors,
    toggleAllSupervisors,
  };

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
}

export function useReportContext() {
  const ctx = useContext(ReportContext);
  if (!ctx)
    throw new Error("useReportContext must be used within ReportProvider");
  return ctx;
}
