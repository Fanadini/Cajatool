# Datos a actualizar

Los datos que cambian viven en `/data`. Cada archivo o bloque tiene `actualizado` (fecha) y `fuente` (URL oficial). Los valores sin verificar se marcan con `"TODO_VERIFICAR": true`.

## Pendientes `TODO_VERIFICAR`

**Ninguno.** Todos los datos cargados salen de fuentes oficiales, verificadas el 24/09/2026.

## Estado de cada dato

| Archivo / bloque | Contenido | Vigencia cargada | Cómo se actualiza | Fuente oficial |
|---|---|---|---|---|
| `indices.json` → `icl` | ICL diario (base 30/6/2020 = 1) | 01/07/2020 al 16/10/2026 | Automático, todos los lunes (`scripts/actualizar-indices.js`) | [BCRA](https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7988) · API `api.bcra.gob.ar/estadisticas/v4.0/monetarias/40` |
| `indices.json` → `ipc` | IPC nacional, nivel general (base dic 2016 = 100) | 12/2016 a 08/2026 | Automático, todos los lunes (mismo script) | [INDEC](https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31) · API datos.gob.ar `148.3_INIVELNAL_DICI_M_26` |
| `indices.json` → `plazoFijo` | Tasa promedio de plazo fijo en pesos, personas humanas (TNA) | Último dato (hoy 19,72 % al 23/09/2026) | Automático, todos los lunes (`scripts/actualizar-indices.js`) | [BCRA](https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables.asp) · API variable 1190 |
| `ganancias.json` → `deducciones` y `escala` | Deducciones del art. 30 y escala del art. 94 (retenciones de 4.ª categoría) | Julio a diciembre de 2026 | **Manual, en enero y julio**: copiar los valores de los PDF nuevos de ARCA | [Deducciones](https://www.afip.gob.ar/gananciasYBienes/ganancias/personas-humanas-sucesiones-indivisas/deducciones/documentos/Deducciones-personales-art-30-jul-dic-2026.pdf) · [Escala](https://www.afip.gob.ar/gananciasYBienes/ganancias/personas-humanas-sucesiones-indivisas/declaracion-jurada/documentos/Tabla-Art-94-LIG-per-jul-a-dic-2026.pdf) |
| `ganancias.json` → `topeAportes` | Base imponible máxima de aportes | Septiembre ($ 4.691.748,47) y octubre 2026 ($ 4.769.631,49) | **Manual, mensual**: agregar la resolución de ANSES de cada mes (Boletín Oficial). Si falta, se usa el último cargado; solo afecta sueldos mayores al tope | [Res. ANSES 284/2026](https://www.boletinoficial.gob.ar/detalleAviso/primera/347832/20260923) |
| `indices.json` → `casaPropia` | Coeficiente Casa Propia mensual | 03/2023 a 11/2026 | **Manual**: bajar el PDF nuevo y copiar los coeficientes | [Ministerio – Coeficiente Casa Propia](https://www.argentina.gob.ar/obras-publicas/coeficiente-casa-propia) |
| `monotributo.json` | 11 categorías, topes y cuotas | Desde 01/08/2026 | Automático, todos los lunes (`scripts/actualizar-monotributo.js`) | [ARCA – Categorías vigentes](https://www.afip.gob.ar/monotributo/categorias.asp) |

## Valores escritos en el texto de las páginas (revisar a mano)

Estos números están en los textos explicativos y ejemplos. No cambian solos cuando se actualizan los datos:

| Página | Qué revisar | Cuándo |
|---|---|---|
| `/alquiler/ajuste-alquiler/` | Ejemplo con IPC e ICL de 2025–2026 (siguen siendo correctos porque son datos históricos) | Solo si se quiere un ejemplo más reciente |
| `/impuestos/monotributo/` | Ejemplos de Valentina (categoría C) y Diego (F) con montos vigentes desde 01/08/2026 | **Febrero y agosto** de cada año, cuando ARCA actualiza la escala |
| `/finanzas/cuotas-o-contado/` | La inflación de referencia (promedios de 3 y 12 meses) se calcula sola en cada build a partir del IPC. El ejemplo usa una inflación supuesta del 2 % y no necesita cambios | — |
| `/laboral/sueldo-neto/` y `/finanzas/plazo-fijo/` | Los ejemplos del texto se calculan solos en cada build con los datos vigentes | — |
| `/laboral/indemnizacion-despido/` | Reglas de la LCT con la Ley 27.802 (art. 245, 231, 233). Revisar si hay nueva reforma o reglamentación | Si cambia la ley |
| `/laboral/aguinaldo/` y `/laboral/vacaciones/` | Fechas de pago y reglas de la LCT (incluye la Ley 27.802 de 2026) | Si hay una nueva reforma laboral |
| Todas las herramientas | Año en el título y el H1 («… 2026») y `updated` en `page.json` | **Enero** de cada año |

## Calendario sugerido

- **Cada mes:** agregar el tope de aportes de ANSES en `ganancias.json` → `topeAportes` (sale a fin del mes anterior en el Boletín Oficial).
- **Enero y julio:** cargar las nuevas deducciones y escala de Ganancias de ARCA en `ganancias.json`.

- **Todos los lunes (automático):** ICL, IPC y monotributo. Si ARCA cambia el formato de su página, el workflow falla y GitHub te avisa por email.
- **Febrero y agosto:** revisar los ejemplos de monotributo.
- **Cada 2 o 3 meses:** revisar si hay un PDF nuevo de Casa Propia (solo mientras sigan vigentes contratos firmados entre el 17/10/2023 y el 28/12/2023).
- **Enero:** cambiar «2026» por el año nuevo en títulos y H1.

## Notas

- La API del BCRA publica el ICL con 2 decimales; la planilla oficial tiene más. La diferencia en el aumento es menor al 0,1 %.
- ARCA actualiza el monotributo dos veces por año por IPC (Ley 27.743). La calculadora no incluye el componente provincial de Ingresos Brutos (monotributo unificado).
