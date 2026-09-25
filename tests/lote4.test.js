const assert = require('assert');
const P = require('../src/pages/utilidades/calcular-porcentaje/calc.js');
const R = require('../src/pages/utilidades/regla-de-tres/calc.js');
const D = require('../src/pages/utilidades/dias-entre-fechas/calc.js');
const I = require('../src/pages/utilidades/calculadora-imc/calc.js');

test('porcentaje: X % de Y, qué porcentaje, variación, aumento/descuento y valor original', () => {
  assert.strictEqual(P.deX(15, 2400), 360);
  assert.strictEqual(P.quePorcentaje(30, 120), 25);
  assert.strictEqual(P.variacion(80, 100), 25);
  assert.strictEqual(P.variacion(100, 80), -20);
  assert.deepStrictEqual(P.aplicar(1000, -20), { resultado: 800, diferencia: -200 });
  assert.strictEqual(P.original(1210, 21), 1000);
  assert.throws(() => P.quePorcentaje(5, 0));
});

test('regla de tres: directa e inversa', () => {
  assert.strictEqual(R.directa(3, 1500, 5), 2500);
  assert.strictEqual(R.inversa(4, 6, 3), 8);
  assert.throws(() => R.directa(0, 1, 2));
});

test('fechas: diferencia con años bisiestos, orden inverso y día final incluido', () => {
  const d = D.diferencia('2024-01-15', '2026-03-10');
  assert.strictEqual(d.dias, 785);
  assert.deepStrictEqual([d.anios, d.meses, d.diasYmd], [2, 1, 23]);
  assert.strictEqual(D.diferencia('2026-03-10', '2026-03-01').dias, -9);
  assert.strictEqual(D.diferencia('2026-01-01', '2026-12-31', true).dias, 365);
  assert.strictEqual(D.sumar('2026-12-20', 15), '2027-01-04');
  assert.strictEqual(D.sumar('2026-03-01', -1), '2026-02-28');
});

test('edad: años, meses, días, próximo cumpleaños y nacidos un 29/2', () => {
  const e = D.edad('1990-05-20', '2026-09-25');
  assert.deepStrictEqual([e.anios, e.meses, e.dias], [36, 4, 5]);
  assert.strictEqual(e.proximoCumple, '2027-05-20');
  assert.strictEqual(e.diaSemana, 0);
  const b = D.edad('2000-02-29', '2026-02-27');
  assert.strictEqual(b.anios, 25);
  assert.strictEqual(b.proximoCumple, '2026-02-28');
  assert.strictEqual(D.edad('2000-09-25', '2026-09-25').faltan, 0);
});

test('IMC: valor, clasificación OMS y rango de peso saludable', () => {
  const r = I.calcular(70, 175);
  assert.strictEqual(r.imc, 22.9);
  assert.strictEqual(r.categoria, 'Peso normal');
  assert.deepStrictEqual([r.pesoMin, r.pesoMax], [56.7, 76.3]);
  assert.strictEqual(I.calcular(80, 170).categoria, 'Sobrepeso');
  assert.strictEqual(I.calcular(50, 175).categoria, 'Bajo peso');
  assert.strictEqual(I.calcular(125, 170).categoria, 'Obesidad grado III');
  assert.strictEqual(I.calcular(81, 180).imc, 25);
  assert.strictEqual(I.calcular(81, 180).categoria, 'Sobrepeso');
});
