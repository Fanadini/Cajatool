const assert = require('assert');
const C = require('../src/pages/finanzas/cuotas-o-contado/calc.js');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);
const anualidad = (c, n, r) => c * (1 - Math.pow(1 + r, -n)) / r; // primera cuota en 1 mes

test('12 cuotas de $ 10.000 vs $ 100.000 de contado con 3 % mensual: el valor hoy es $ 99.540 → prácticamente igual (0,46 %)', () => {
  const r = C.calcular({ contado: 100000, cuotas: 12, valorCuota: 10000, tasaMensual: 3, primerMes: 1 });
  near(r.valorPresente, anualidad(10000, 12, 0.03), 0.01);
  assert.strictEqual(r.valorPresente, 99540.04);
  assert.strictEqual(r.conviene, 'igual'); // diferencia de 0,46 %: prácticamente lo mismo
  assert.strictEqual(r.totalCuotas, 120000);
  assert.strictEqual(r.recargo, 20);
});

test('6 cuotas sin interés de $ 20.000 (contado $ 120.000) con 2 % mensual → conviene cuotas, tasa implícita 0 %', () => {
  const r = C.calcular({ contado: 120000, cuotas: 6, valorCuota: 20000, tasaMensual: 2, primerMes: 1 });
  near(r.valorPresente, anualidad(20000, 6, 0.02), 0.01);
  assert.strictEqual(r.conviene, 'cuotas');
  assert.strictEqual(r.temImplicita, 0);
  assert.ok(r.diferencia > 7000);
});

test('12 cuotas de $ 12.000 (contado $ 100.000) con 2 % mensual → conviene contado; TEM implícita ≈ 6,11 %', () => {
  const r = C.calcular({ contado: 100000, cuotas: 12, valorCuota: 12000, tasaMensual: 2, primerMes: 1 });
  assert.strictEqual(r.conviene, 'contado');
  near(r.valorPresente, anualidad(12000, 12, 0.02), 0.01);
  near(C.valorPresente(12000, 12, r.temImplicita / 100, 1), 100000, 30, 'la TEM iguala el valor hoy con el contado');
  near(r.temImplicita, 6.11, 0.01);
  near(r.teaImplicita, (Math.pow(1 + r.temImplicita / 100, 12) - 1) * 100, 0.1);
});

test('primera cuota hoy: la cuota 1 no se descuenta', () => {
  const r = C.calcular({ contado: 30000, cuotas: 3, valorCuota: 10000, tasaMensual: 5, primerMes: 0 });
  assert.deepStrictEqual(r.filas.map((f) => f.mes), [0, 1, 2]);
  assert.strictEqual(r.filas[0].valorHoy, 10000);
  near(r.valorPresente, 10000 + 10000 / 1.05 + 10000 / 1.05 ** 2, 0.01);
});

test('con precio de contado con descuento, las cuotas "sin interés" pueden no convenir', () => {
  // Contado con 15 % de descuento: $ 85.000; o 3 cuotas de $ 33.333,33; inflación 2 %
  const r = C.calcular({ contado: 85000, cuotas: 3, valorCuota: 33333.33, tasaMensual: 2, primerMes: 1 });
  assert.strictEqual(r.conviene, 'contado');
  assert.ok(r.temImplicita > 8);
});

test('promedio mensual geométrico y validaciones', () => {
  near(C.promedioMensual([1.89, 2.11, 1.66]), (Math.cbrt(1.0189 * 1.0211 * 1.0166) - 1) * 100, 1e-9);
  assert.throws(() => C.calcular({ contado: 0, cuotas: 3, valorCuota: 1, tasaMensual: 2 }));
  assert.throws(() => C.calcular({ contado: 100, cuotas: 2.5, valorCuota: 1, tasaMensual: 2 }));
});
