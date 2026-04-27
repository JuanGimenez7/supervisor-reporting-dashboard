# Mejoras y correcciones por hacer:

1. Pestaña de Condiciones Activas / Concursos. (detalle de como van sus asesores en el concurso activo).
2. Pestaña de Marcas. Ppto / venta / Alcance.
3. Modificar, actualizar y mejorar exportaciones a PDF y Excel.
4. Poder filtrar por varios supervisores o vendedores si se desea (selección múltiple).
5. Poder ordenar filas de la tabla según orden alfabético (1era columna) o tamaño numérico (las demás).
6. Actualizar y mejorar la lógica de los filtros supervisor y vendedor para que sea en cascada.

Prompt para refactorizacion de tabla y filtros (falta corregir que dañó el query parameters en todo sentido. NOTA: mentira, parece que en realidad el query parameters si servia bien, no estoy seguro):

Observa que @src/components/FiltersAndTable.tsx retorna una section, que podemos subdividir en dos subsecciones principales: 1. el div que contiene el boton de expandir/colapsar, los filtros y exportaciones de vista actual. 2. La tabla y y todas sus funcionalidades (expansiones, modales, etc.)

Quisiera dividir esas dos partes principales, manteniendo exactamente la misma funcionalidad. Solo sera una refactorizacion de codigo y de UI, pero la funcionalidad actual que permanezca basicamente identica. Haz lo siguiente:

1. Extrae la primera subseccion (solamente dejando el boton de expandir/colapsar todo) a otro componente llamado FiltersAndExports.tsx.
2. El componente actual ahora se llamara DashboardTable.tsx.
3. FiltersAndExports.tsx va a retornar un section, colocado como una card abajo de @src/components/Legend.tsx y arriba de @src/components/ConsolidatedSummary.tsx en @src/app/dashboard/page.tsx