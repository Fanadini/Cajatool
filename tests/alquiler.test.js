const assert = require('assert');
const A = require('../src/pages/alquiler/ajuste-alquiler/calc.js');
const data = require('../data/indices.json');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);

test('porcentaje fijo: $100.000 con 10 % trimestral durante 12 meses', () => {
  const r = A.calcular({ monto: 100000, inicio: '2025-01-01', frecuencia: 3, duracion: 12, indice: 'fijo', porcentaje: 10 }, data);
  assert.deepStrictEqual(r.periodos.map((p) => p.monto), [100000, 110000, 121000, 133100]);
  assert.deepStrictEqual(r.periodos.map((p) => p.desde), ['2025-01-01', '2025-04-01', '2025-07-01', '2025-10-01']);
  assert.strictEqual(r.periodos[3].hasta, '2025-12-31');
  near(r.aumentoTotal, 33.1, 1e-9);
});

test('ICL anual: factor = ICL del día de ajuste / ICL del día de inicio (1/3/2024 = 9,16 según BCRA)', () => {
  assert.strictEqual(A.iclValue(data.icl, '2024-03-01'), 9.16);
  const r = A.calcular({ monto: 300000, inicio: '2024-03-01', frecuencia: 12, duracion: 24, indice: 'icl' }, data);
  const esperado = A.iclValue(data.icl, '2025-03-01') / 9.16;
  near(r.periodos[1].factor, esperado, 1e-12);
  near(r.periodos[1].monto, Math.round(300000 * esperado * 100) / 100, 0.001);
});

test('IPC trimestral sin desfase: ene–mar 2025 = 2,2 % · 2,4 % · 3,7 % (INDEC) ≈ 8,53 %', () => {
  const r = A.calcular({ monto: 500000, inicio: '2025-01-10', frecuencia: 3, duracion: 12, indice: 'ipc', desfase: 0 }, data);
  const esperado = 1.022 * 1.024 * 1.037;
  near(r.periodos[1].factor, esperado, 0.001, 'factor');
  assert.strictEqual(r.periodos[1].detalle, 'IPC 2025-01 a 2025-03');
});

test('IPC con 1 mes de desfase usa dic 2024 – feb 2025 (2,7 % · 2,2 % · 2,4 %)', () => {
  const r = A.calcular({ monto: 500000, inicio: '2025-01-10', frecuencia: 3, duracion: 12, indice: 'ipc', desfase: 1 }, data);
  near(r.periodos[1].factor, 1.027 * 1.022 * 1.024, 0.001, 'factor');
  assert.strictEqual(r.periodos[1].detalle, 'IPC 2024-12 a 2025-02');
});

test('Casa Propia semestral: producto de los coeficientes feb–jul 2024 del PDF oficial', () => {
  const r = A.calcular({ monto: 200000, inicio: '2024-01-15', frecuencia: 6, duracion: 24, indice: 'casapropia' }, data);
  const esperado = 1.0708 * 1.0727 * 1.0749 * 1.0859 * 1.092 * 1.0921;
  near(r.periodos[1].factor, esperado, 1e-9);
  near(r.periodos[1].monto, 200000 * esperado, 0.01);
});

test('los ajustes sin dato publicado quedan como pendientes', () => {
  const r = A.calcular({ monto: 100000, inicio: '2026-06-01', frecuencia: 6, duracion: 36, indice: 'ipc' }, data);
  assert.strictEqual(r.periodos[0].estado, 'ok');
  assert.ok(r.periodos.slice(1).every((p) => p.estado === 'pendiente'));
  assert.strictEqual(r.pendientes, 5);
});

test('fechas: fin de mes y año bisiesto', () => {
  assert.strictEqual(A.addMonths('2024-01-31', 1), '2024-02-29');
  assert.strictEqual(A.addMonths('2025-08-31', 6), '2026-02-28');
  assert.strictEqual(A.addMonths('2025-11-15', 3), '2026-02-15');
});

test('valida datos de entrada', () => {
  assert.throws(() => A.calcular({ monto: 0, inicio: '2025-01-01', frecuencia: 3, indice: 'fijo', porcentaje: 5 }, data));
  assert.throws(() => A.calcular({ monto: 1000, inicio: '01/01/2025', frecuencia: 3, indice: 'fijo', porcentaje: 5 }, data));
  assert.throws(() => A.calcular({ monto: 1000, inicio: '2025-01-01', frecuencia: 5, indice: 'fijo', porcentaje: 5 }, data));
});
