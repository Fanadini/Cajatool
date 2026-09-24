const assert = require('assert');
const F = require('../src/assets/js/format.js');

test('fmtMoney usa formato argentino', () => {
  assert.strictEqual(F.fmtMoney(1234567.891), '$ 1.234.567,89');
  assert.strictEqual(F.fmtMoney(0), '$ 0,00');
});
test('parseAR entiende puntos de miles y coma decimal', () => {
  assert.strictEqual(F.parseAR('1.234.567,89'), 1234567.89);
  assert.strictEqual(F.parseAR('$ 350.000'), 350000);
  assert.strictEqual(F.parseAR('1234,5'), 1234.5);
  assert.strictEqual(F.parseAR('1.5'), 1.5);
});
test('parseAR rechaza texto inválido', () => {
  assert.ok(Number.isNaN(F.parseAR('abc')));
  assert.ok(Number.isNaN(F.parseAR('')));
});
