const assert = require('assert');
const H = require('../src/pages/utilidades/husos-horarios/calc.js');

test('Buenos Aires 12:00 del 15/1/2026 → Madrid 16:00 (invierno, CET)', () => {
  const [r] = H.convertir('2026-01-15T12:00', 'America/Argentina/Buenos_Aires', ['Europe/Madrid']);
  assert.strictEqual(r.hora, '16:00');
  assert.strictEqual(r.offsetTexto, 'UTC+1');
  assert.strictEqual(r.verano, false);
});

test('Buenos Aires 12:00 del 15/7/2026 → Madrid 17:00 (horario de verano, CEST)', () => {
  const [r] = H.convertir('2026-07-15T12:00', 'America/Argentina/Buenos_Aires', ['Europe/Madrid']);
  assert.strictEqual(r.hora, '17:00');
  assert.strictEqual(r.verano, true);
});

test('Nueva York cambia de hora el 8/3/2026: el 9/3 a las 10:00 son las 11:00 en Buenos Aires', () => {
  const [antes] = H.convertir('2026-03-07T10:00', 'America/New_York', ['America/Argentina/Buenos_Aires']);
  const [despues] = H.convertir('2026-03-09T10:00', 'America/New_York', ['America/Argentina/Buenos_Aires']);
  assert.strictEqual(antes.hora, '12:00');
  assert.strictEqual(despues.hora, '11:00');
});

test('cambio de día y zonas con media hora: BA 22:00 → Tokio 10:00 del día siguiente, India 06:30', () => {
  const r = H.convertir('2026-05-01T22:00', 'America/Argentina/Buenos_Aires', ['Asia/Tokyo', 'Asia/Kolkata']);
  assert.deepStrictEqual([r[0].hora, r[0].diaRelativo, r[0].fecha], ['10:00', 1, '2026-05-02']);
  assert.deepStrictEqual([r[1].hora, r[1].offsetTexto], ['06:30', 'UTC+5:30']);
});

test('Argentina no tiene horario de verano y es UTC−3 todo el año', () => {
  for (const d of ['2026-01-10T12:00:00Z', '2026-07-10T12:00:00Z']) {
    assert.strictEqual(H.offsetMinutes('America/Argentina/Buenos_Aires', new Date(d)), -180);
    assert.strictEqual(H.isDST('America/Argentina/Buenos_Aires', new Date(d)), false);
  }
});

test('hemisferio sur: Sídney está en horario de verano en enero', () => {
  assert.strictEqual(H.isDST('Australia/Sydney', new Date('2026-01-10T00:00:00Z')), true);
  assert.strictEqual(H.isDST('Australia/Sydney', new Date('2026-07-10T00:00:00Z')), false);
});
