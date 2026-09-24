# Datos a actualizar

Los datos que cambian viven en `/data`. Cada bloque tiene `actualizado` (fecha) y `fuente` (URL oficial). Los valores sin verificar se marcan con `"TODO_VERIFICAR": true`.

## Estado actual

| Archivo / bloque | Estado | Cómo se actualiza | Fuente oficial |
|---|---|---|---|
| `indices.json` → `icl` | ✅ Oficial (BCRA), diario hasta 16/10/2026 | Automático: `node scripts/actualizar-indices.js` (workflow semanal) | [BCRA – ICL](https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7988) · API `api.bcra.gob.ar/estadisticas/v4.0/monetarias/40` |
| `indices.json` → `ipc` | ✅ Oficial (INDEC), mensual hasta 08/2026 | Automático: mismo script | [INDEC – IPC](https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31) · API datos.gob.ar serie `148.3_INIVELNAL_DICI_M_26` |
| `monotributo.json` | ✅ Oficial (ARCA), 11 categorías vigentes desde 01/08/2026 | Automático: `node scripts/actualizar-monotributo.js` (lee la tabla de ARCA; falla sin tocar el archivo si cambia el formato) | [ARCA – Categorías](https://www.afip.gob.ar/monotributo/categorias.asp) |
| `indices.json` → `casaPropia` | ✅ Oficial, mensual hasta 11/2026 (cargado del PDF del 24/09/2026) | **Manual**: bajar el PDF nuevo de la fuente y copiar los coeficientes mensuales | [Coeficiente Casa Propia](https://www.argentina.gob.ar/obras-publicas/coeficiente-casa-propia) |

## Pendientes `TODO_VERIFICAR`

_Ninguno: todos los datos cargados salen de fuentes oficiales verificadas el 24/09/2026._

## Notas

- La API del BCRA publica el ICL con 2 decimales. La planilla oficial del BCRA tiene más decimales: la diferencia en el aumento es menor al 0,1 %.
- El coeficiente Casa Propia se usa solo en contratos firmados entre el 17/10/2023 y el 28/12/2023 (Ley 27.737). Cuando esos contratos terminen (fines de 2026), se puede dejar de actualizar.
- Monotributo: ARCA actualiza los montos dos veces por año (febrero y agosto) por IPC. La próxima actualización esperada es la de febrero de 2027. La calculadora no incluye el componente provincial de Ingresos Brutos (monotributo unificado).
