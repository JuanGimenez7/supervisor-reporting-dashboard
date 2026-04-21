export type SemaforoKind = "ventas" | "clientes" | "cobros";

// Devuelve una clase de Tailwind ligera según el valor de cumplimiento (porcentaje)
export function getSemaforoClass(kind: SemaforoKind, value: number): string {
  // `value` está en porcentaje (0-100)
  if (kind === "clientes") {
    if (value >= 59.5) return "bg-green-100";
    if (value >= 39.5) return "bg-yellow-100";
    return "bg-red-100";
  }

  // ventas y cobros usan los mismos umbrales
  if (value >= 89.5) return "bg-green-100";
  if (value >= 59.5) return "bg-yellow-100";
  return "bg-red-100";
}
