# Datos a actualizar

Los datos que cambian viven en `/data`. Cada archivo o bloque tiene `actualizado` (fecha) y `fuente` (URL oficial). Los valores sin verificar se marcan con `"TODO_VERIFICAR": true`.

## Pendientes `TODO_VERIFICAR`

**Ninguno.** Todos los datos cargados salen de fuentes oficiales, verificadas el 24/09/2026.

## Estado de cada dato

| Archivo / bloque | Contenido | Vigencia cargada | Cómo se actualiza | Fuente oficial |
|---|---|---|---|---|
| `indices.json` → `icl` | ICL diario (base 30/6/2020 = 1) | 01/07/2020 al 16/10/2026 | Automático, todos los lunes (`scripts/actualizar-indices.js`) | [BCRA](https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7988) · API `api.bcra.gob.ar/estadisticas/v4.0/monetarias/40` |
| `indices.json` → `ipc` | IPC nacional, nivel general (base dic 2016 = 100) | 12/2016 a 08/2026 | Automático, todos los lunes (mismo script) | [INDEC](https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31) · API datos.gob.ar `148.3_INIVELNAL_DICI_M_26` |
| `indices.json` → `casaPropia` | Coeficiente Casa Propia mensual | 03/2023 a 11/2026 | **Manual**: bajar el PDF nuevo y copiar los coeficientes | [Ministerio – Coeficiente Casa Propia](https://www.argentina.gob.ar/obras-publicas/coeficiente-casa-propia) |
| `monotributo.json` | 11 categorías, topes y cuotas | Desde 01/08/2026 | Automático, todos los lunes (`scripts/actualizar-monotributo.js`) | [ARCA – Categorías vigentes](https://www.afip.gob.ar/monotributo/categorias.asp) |

## Valores escritos en el texto de las páginas (revisar a mano)

Estos números están en los textos explicativos y ejemplos. No cambian solos cuando se actualizan los datos:

| Página | Qué revisar | Cuándo |
|---|---|---|
| `/alquiler/ajuste-alquiler/` | Ejemplo con IPC e ICL de 2025–2026 (siguen siendo correctos porque son datos históricos) | Solo si se quiere un ejemplo más reciente |
| `/impuestos/monotributo/` | Ejemplos de Valentina (categoría C) y Diego (F) con montos vigentes desde 01/08/2026 | **Febrero y agosto** de cada año, cuando ARCA actualiza la escala |
| `/laboral/aguinaldo/` y `/laboral/vacaciones/` | Fechas de pago y reglas de la LCT (incluye la Ley 27.802 de 2026) | Si hay una nueva reforma laboral |
| Todas las herramientas | Año en el título y el H1 («… 2026») y `updated` en `page.json` | **Enero** de cada año |

## Calendario sugerido

- **Todos los lunes (automático):** ICL, IPC y monotributo. Si ARCA cambia el formato de su página, el workflow falla y GitHub te avisa por email.
- **Febrero y agosto:** revisar los ejemplos de monotributo.
- **Cada 2 o 3 meses:** revisar si hay un PDF nuevo de Casa Propia (solo mientras sigan vigentes contratos firmados entre el 17/10/2023 y el 28/12/2023).
- **Enero:** cambiar «2026» por el año nuevo en títulos y H1.

## Notas

- La API del BCRA publica el ICL con 2 decimales; la planilla oficial tiene más. La diferencia en el aumento es menor al 0,1 %.
- ARCA actualiza el monotributo dos veces por año por IPC (Ley 27.743). La calculadora no incluye el componente provincial de Ingresos Brutos (monotributo unificado).
