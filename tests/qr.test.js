const assert = require('assert');
const Q = require('../src/pages/utilidades/generador-qr/calc.js');
const qrcode = require('../src/assets/vendor/qrcode-generator/qrcode.js');

test('URL: agrega https:// si falta', () => {
  assert.strictEqual(Q.payload('url', { url: 'cajatools.com' }), 'https://cajatools.com');
  assert.strictEqual(Q.payload('url', { url: 'http://ejemplo.com/a?b=1' }), 'http://ejemplo.com/a?b=1');
});

test('WiFi: formato estándar con caracteres especiales escapados', () => {
  assert.strictEqual(Q.payload('wifi', { ssid: 'Casa;Pérez', password: 'a:b,c"d', seguridad: 'WPA' }), 'WIFI:T:WPA;S:Casa\\;Pérez;P:a\\:b\\,c\\"d;;');
  assert.strictEqual(Q.payload('wifi', { ssid: 'Bar', seguridad: 'nopass' }), 'WIFI:T:nopass;S:Bar;;');
  assert.strictEqual(Q.payload('wifi', { ssid: 'X', password: 'y', oculta: true }), 'WIFI:T:WPA;S:X;P:y;H:true;;');
});

test('WhatsApp: número argentino → 549 + área sin 15, mensaje codificado', () => {
  assert.strictEqual(Q.payload('whatsapp', { telefono: '11 15-2345-6789', pais: 'AR', mensaje: '¡Hola! ¿Cómo va?' }),
    'https://wa.me/5491123456789?text=%C2%A1Hola!%20%C2%BFC%C3%B3mo%20va%3F');
  assert.strictEqual(Q.payload('whatsapp', { telefono: '011 2345 6789', pais: 'AR' }), 'https://wa.me/5491123456789');
  assert.strictEqual(Q.payload('whatsapp', { telefono: '+34 612 345 678' }), 'https://wa.me/34612345678');
});

test('email: mailto con asunto y cuerpo', () => {
  assert.strictEqual(Q.payload('email', { email: 'hola@cajatools.com', asunto: 'Consulta', cuerpo: 'Línea 1' }),
    'mailto:hola@cajatools.com?subject=Consulta&body=L%C3%ADnea%201');
  assert.throws(() => Q.payload('email', { email: 'no-es-email' }));
});

test('la librería genera un QR válido en UTF-8 y el SVG tiene el tamaño correcto', () => {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData('https://cajatools.com/ñandú', 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  assert.ok(n >= 25 && (n - 17) % 4 === 0, `módulos: ${n}`);
  const svg = Q.toSvg(n, (r, c) => qr.isDark(r, c));
  assert.ok(svg.startsWith('<svg') && svg.includes(`viewBox="0 0 ${n + 8} ${n + 8}"`));
});
