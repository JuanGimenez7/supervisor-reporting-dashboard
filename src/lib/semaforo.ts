export type SemaforoKind = "ventas" | "clientes" | "cobros" | "renglones";

// Devuelve información del "must" calculado para el día anterior al indicado
// (por defecto: día anterior a hoy). Considera hábiles de lunes a viernes.
export function computeMustInfo(date?: Date) {
  const now = date ? new Date(date) : new Date();
  // referencia: día anterior
  const ref = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  ref.setDate(ref.getDate() - 1);

  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const isWorkingDay = (y: number, m: number, dd: number) => {
    const dow = new Date(y, m, dd).getDay();
    return dow !== 0 && dow !== 6;
  };

  const dim = daysInMonth(year, month);
  let totalWorking = 0;
  let elapsedWorking = 0;
  for (let i = 1; i <= dim; i++) {
    if (isWorkingDay(year, month, i)) {
      totalWorking++;
      if (i <= day) elapsedWorking++;
    }
  }
  const must = totalWorking === 0 ? 0 : elapsedWorking / totalWorking;
  return { must, elapsedWorking, totalWorking, ref };
}

// Compatibilidad: computeMust sigue existiendo y devuelve solo la fracción.
export function computeMust(date?: Date): number {
  return computeMustInfo(date).must;
}

// Devuelve el emoji del semáforo según el valor de cumplimiento (porcentaje).
// Acepta un `mustOverride` opcional (0..1) para forzar el porcentaje del mes.
export function getSemaforoEmoji(
  kind: SemaforoKind,
  value: number,
  mustOverride?: number,
): string {
  const must = typeof mustOverride === "number" ? mustOverride : computeMust();

  // Umbrales base al final de mes
  const VENTAS_Y_COBROS_YELLOW = 60;
  const VENTAS_Y_COBROS_GREEN = 90;
  const CLIENTES_YELLOW = 40;
  const CLIENTES_GREEN = 60;
  const RENGLONES_YELLOW = 400;
  const RENGLONES_GREEN = 600;

  const ventasYellowThreshold = VENTAS_Y_COBROS_YELLOW * must;
  const ventasGreenThreshold = VENTAS_Y_COBROS_GREEN * must;
  const clientesYellowThreshold = CLIENTES_YELLOW * must;
  const clientesGreenThreshold = CLIENTES_GREEN * must;
  const renglonesYellowThreshold = RENGLONES_YELLOW * must;
  const renglonesGreenThreshold = RENGLONES_GREEN * must;

  if (kind === "clientes") {
    if (value >= clientesGreenThreshold) return "🟢";
    if (value >= clientesYellowThreshold) return "🟡";
    return "🔴";
  }

  if (kind === "renglones") {
    if (value >= renglonesGreenThreshold) return "🟢";
    if (value >= renglonesYellowThreshold) return "🟡";
    return "🔴";
  }

  if (value >= ventasGreenThreshold) return "🟢";
  if (value >= ventasYellowThreshold) return "🟡";
  return "🔴";
}
