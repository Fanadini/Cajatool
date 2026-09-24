const assert = require('assert');
const S = require('../src/pages/laboral/aguinaldo/calc.js');

test('semestre completo: 50 % del mejor sueldo (mejor de 6 sueldos = $ 1.200.000)', () => {
  const r = S.calcular({ anio: 2026, semestre: 1, sueldos: [1000000, 1000000, 1100000, 1200000, 1150000, 1150000] });
  assert.strictEqual(r.mejorSueldo, 1200000);
  assert.strictEqual(r.bruto, 600000);
  assert.strictEqual(r.descuentos, 102000);
  assert.strictEqual(r.neto, 498000);
  assert.strictEqual(r.completo, true);
  assert.strictEqual(r.fechaPago, '2026-06-30');
});

test('proporcional: ingreso el 1/10/2026 en el 2.º semestre (92 de 184 días) → la mitad', () => {
  const r = S.calcular({ anio: 2026, semestre: 2, mejorSueldo: 900000, ingreso: '2026-10-01' });
  assert.strictEqual(r.diasSemestre, 184);
  assert.strictEqual(r.diasTrabajados, 92);
  assert.strictEqual(r.bruto, 225000);
  assert.strictEqual(r.fechaPago, '2026-12-18');
});

test('proporcional por egreso: renuncia el 31/3/2026 → 90 de 181 días', () => {
  const r = S.calcular({ anio: 2026, semestre: 1, mejorSueldo: 1000000, egreso: '2026-03-31' });
  assert.strictEqual(r.diasSemestre, 181);
  assert.strictEqual(r.diasTrabajados, 90);
  assert.strictEqual(r.bruto, Math.round(500000 * 90 / 181 * 100) / 100); // 248.618,78
});

test('año bisiesto: el 1.er semestre de 2028 tiene 182 días', () => {
  assert.strictEqual(S.calcular({ anio: 2028, semestre: 1, mejorSueldo: 100 }).diasSemestre, 182);
});

test('valida datos de entrada', () => {
  assert.throws(() => S.calcular({ anio: 2026, semestre: 1, sueldos: [] }));
  assert.throws(() => S.calcular({ anio: 2026, semestre: 1, mejorSueldo: 1000, ingreso: '2026-08-01' }));
});
