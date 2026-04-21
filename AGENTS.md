# AGENTS.md

## Resumen del Proyecto
- **Proyecto**: `supervisor-reporting-dashboard`
- **Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Fuente de datos**: Archivo JSON estático (`public/report-[dd-mm].json`)
- **Objetivo principal**: Dashboard filtrable de ventas/reporte por supervisor
- **Exportaciones**: PDF y Excel para vista filtrada y lotes agrupados
- **Destino de despliegue**: Netlify (export estático)

## Reglas de Trabajo para Agentes
1. Mantener la app compatible con export estático (`output: "export"` en `next.config.ts`).
2. No introducir funcionalidades exclusivas de servidor salvo aprobación explícita del usuario para migrar fuera de hosting estático.
3. Priorizar una UI rápida, simple y mantenible sobre arquitectura avanzada.
4. Mantener etiquetas/contenido en español cuando sean visibles para el usuario.
5. Mantener dependencias mínimas y alineadas al stack actual.

## Gestor de Paquetes y Comandos
- Gestor recomendado: `pnpm`
- Instalar: `pnpm install`
- Servidor de desarrollo: `pnpm dev`
- Lint: `pnpm lint`
- Build de producción: `pnpm build`

## Restricciones de Export Estático (Crítico)
Como la app se despliega como archivos estáticos:
- Evitar API routes (`app/api/*`, `pages/api/*`).
- Evitar lógica de servidor en tiempo de request (render dependiente de headers/cookies).
- Evitar patrones de render dinámico en servidor que requieran runtime de Node.
- Mantener carga de datos en cliente o estática desde `public/` en build/runtime.

Si una funcionalidad solicitada requiere backend, explicar trade-offs y pedir aprobación explícita antes de implementarla.

## Convenciones de Datos y Dominio
- Tratar cada fila del JSON como un registro del reporte.
- Importante: `SUPERVISOR`, `VENDEDOR` y `REGION` **no son únicos por fila**; sus valores se repiten en múltiples registros.
- No asumir unicidad de esas dimensiones para lógica de UI, filtros o exportación.
- Cuando se necesiten opciones de filtro, construir catálogos con valores únicos derivados del dataset (sin alterar las filas originales).
- Cuando se necesiten agregaciones, agrupar explícitamente por la dimensión seleccionada (`SUPERVISOR`, `VENDEDOR`, `REGION`).
- Contrato actual del dataset (`public/report-[dd-mm].json`):
  - `SUPERVISOR` (string)
  - `REGION` (string)
  - `VENDEDOR` (string)
  - `PRESUPUESTO_VENTAS` (numeric string)
  - `VENDIDO` (numeric string)
  - `CARTERA_CLIENTES` (numeric string)
  - `CLIENTES_ACTIVADOS` (numeric string)
  - `PRESUPUESTO_COBROS` (numeric string)
  - `COBRADO` (numeric string)
  - `MARCAS_ACTIVADAS` (numeric string)
  - `RENGLONES_IMPORTADOS` (numeric string)
  - `RENGLONES_NACIONALES` (numeric string)
- Los campos numéricos actualmente vienen como strings en el JSON y deben parsearse antes de cálculos/agregaciones/exportaciones.
- Mantener compatibilidad con la fuente cruda:
  - No renombrar las claves crudas dentro de `report-[dd-mm].json`.
  - Si hace falta, mapear claves crudas a claves internas en un helper de transformación dedicado.
- Reglas de normalización para parseo numérico:
  - Aplicar `trim` a espacios.
  - Tratar valores vacíos como `0`.
  - Remover separadores/símbolos si aparecen en futuras cargas.
  - Usar parseo seguro con fallback a `0` para evitar `NaN` en totales.

## Contrato de Tipos para Futuros Agentes
Al crear tipos, mantener un tipo crudo y uno normalizado.

- Tipo crudo sugerido (desde JSON):
  - `SupervisorReportRowRaw` con claves exactas en mayúsculas y valores string.
- Tipo normalizado sugerido (para UI y exportaciones):
  - `SupervisorReportRow` con:
    - `supervisor`, `region`, `vendedor` como `string`
    - todos los campos métricos como `number`

Realizar la conversión en un solo lugar (por ejemplo `src/lib/normalize-report.ts`) y reutilizarla en todo el proyecto.

## Prioridades de UI
1. Filtrado rápido por supervisor, vendedor, región y texto libre cuando sea útil.
2. Resultados tabulares claros primero (gráficas opcionales/secundarias).
3. Barra de filtros fija + comportamiento responsivo de tabla cuando sea posible.
4. Estados vacíos explícitos ("Sin resultados") para vistas filtradas.
5. Las opciones de filtro deben derivarse de valores únicos normalizados de `SUPERVISOR`, `VENDEDOR` y `REGION`.

## Requisitos de Exportación
- **Export de la vista actual**:
  - Excel (`xlsx`) con las filas visibles filtradas.
  - PDF (`jspdf` + `jspdf-autotable`) con las filas visibles filtradas.
- **Export por lote por categoría**:
  - Generar un archivo por entidad (mínimo: `SUPERVISOR` y `VENDEDOR`).
  - Usar `jszip` cuando se exporten muchos archivos juntos.
  - Usar nombres de archivo estables y seguros (`slug + timestamp`).
  - Incluir categoría y entidad en el nombre (ejemplo: `supervisor-luis-landaeta.xlsx`).
  - Al agrupar para lote, consolidar todas las filas que compartan la misma entidad (por ejemplo, todas las filas de un mismo `SUPERVISOR`).

## Estructura Interna Sugerida
- `src/types/` para tipos de filas y filtros
- `src/lib/` para helpers puros:
  - filtrado
  - agrupación
  - normalización numérica
  - nomenclatura de archivos
  - helpers de exportación (excel/pdf/zip)
- `src/components/` para UI:
  - panel de filtros
  - tabla de datos
  - barra de acciones de exportación
- `src/app/page.tsx` como página principal de composición

## Estándar de Nomenclatura (App)
- **Archivos y carpetas**:
  - Componentes React: `PascalCase` (ejemplo: `ReportTable.tsx`, `FilterPanel.tsx`).
  - Utilidades/hooks/helpers: `kebab-case` o `camelCase` consistente por carpeta (preferencia sugerida: `kebab-case`, ejemplo `normalize-report.ts`).
  - Tipos/interfaces: en `src/types/` con nombres descriptivos (ejemplo: `report.ts`).
- **Símbolos en código**:
  - Variables y funciones: `camelCase` (`filteredRows`, `buildUniqueOptions`).
  - Componentes, tipos, interfaces y enums: `PascalCase` (`SupervisorReportRow`, `ExportMode`).
  - Constantes globales: `UPPER_SNAKE_CASE` (`DEFAULT_FILTER_VALUE`, `EXPORT_DATE_FORMAT`).
  - Booleans con prefijos claros: `is`, `has`, `can`, `should` (`isLoading`, `hasRows`).
- **Claves de datos**:
  - Mantener claves crudas del JSON en mayúsculas (`SUPERVISOR`, `VENDEDOR`, `REGION`, etc.).
  - Para uso interno normalizado, usar `camelCase` (`supervisor`, `vendedor`, `region`).
- **Eventos y handlers**:
  - Nombrar handlers como `handleX` (`handleFilterChange`, `handleExportPdf`).
- **Regla de consistencia**:
  - No mezclar estilos en un mismo módulo; elegir una convención y mantenerla en todo el archivo.
  - Priorizar nombres explícitos sobre abreviaturas ambiguas.

## Estándares de Código
- Usar patrones TypeScript estrictos (evitar `any` salvo que sea inevitable).
- Mantener helpers puros y testeables.
- Evitar componentes monolíticos grandes; dividir por responsabilidad.
- Preferir nombres legibles en inglés para símbolos de código; mantener etiquetas de negocio en español si son visibles al usuario.

## Checklist de Validación Antes de Terminar
1. `pnpm lint` pasa (o cualquier issue restante queda claramente documentado).
2. `pnpm build` finaliza correctamente.
3. El build contiene `out/` para despliegue estático.
4. No se introdujeron funcionalidades de Next.js exclusivas de servidor.
5. La lógica de filtros y exportaciones fue validada manualmente con filas de muestra.

## Notas para Netlify
- Comando de build: `pnpm build`
- Directorio de publicación: `out`
- Mantener requisitos de entorno mínimos; esta app debe correr sin secretos de servidor.
