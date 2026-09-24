const assert = require('assert');
const V = require('../src/pages/laboral/vacaciones/calc.js');

test('escala del art. 150: 14, 21, 28 y 35 días', () => {
  assert.deepStrictEqual([0, 4, 5, 9, 10, 19, 20, 35].map(V.diasPorAntiguedad), [14, 14, 21, 21, 28, 28, 35, 35]);
});

test('ingreso 15/12/2021: al 31/12/2026 tiene 5 años → 21 días; $ 1.000.000 / 25 × 21 = $ 840.000', () => {
  const r = V.calcular({ ingreso: '2021-12-15', anio: 2026, sueldo: 1000000 });
  assert.strictEqual(r.antiguedad, 5);
  assert.strictEqual(r.dias, 21);
  assert.strictEqual(r.valorDia, 40000);
  assert.strictEqual(r.pago, 840000);
  assert.strictEqual(r.plus, 140000); // 840.000 − 1.000.000 / 30 × 21
});

test('ingreso 1/3/2026: trabajó más de la mitad del año → 14 días completos', () => {
  const r = V.calcular({ ingreso: '2026-03-01', anio: 2026, sueldo: 750000 });
  assert.strictEqual(r.proporcional, false);
  assert.strictEqual(r.dias, 14);
  assert.strictEqual(r.pago, 420000);
});

test('ingreso 1/9/2026: menos de la mitad del año → 1 día cada 20 hábiles (88 hábiles: 22+22+21+23 → 4 días)', () => {
  const r = V.calcular({ ingreso: '2026-09-01', anio: 2026, sueldo: 800000 });
  assert.strictEqual(r.diasTrabajados, 88);
  assert.strictEqual(r.proporcional, true);
  assert.strictEqual(r.dias, 4);
  assert.strictEqual(r.pago, 128000);
});

test('días trabajados cargados a mano tienen prioridad', () => {
  const r = V.calcular({ ingreso: '2015-01-01', anio: 2026, sueldo: 1000000, diasTrabajados: 100 });
  assert.strictEqual(r.proporcional, true);
  assert.strictEqual(r.dias, 5);
});

test('valida datos de entrada', () => {
  assert.throws(() => V.calcular({ ingreso: '2027-01-01', anio: 2026, sueldo: 1000 }));
  assert.throws(() => V.calcular({ ingreso: '2020-01-01', anio: 2026, sueldo: 0 }));
});
