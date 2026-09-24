(function () {
  'use strict';
  var Q = window.CTQR;
  var qrcode = window.qrcode;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-qr');
  var canvas = $('qr-canvas');
  var actual = null; // { qr, contenido }
  var timer;

  function tipo() { return form.querySelector('input[name="tipo"]:checked').value; }

  function datos() {
    return {
      url: $('url').value, texto: $('texto').value,
      ssid: $('ssid').value, password: $('wifi-pass').value, seguridad: $('seguridad').value, oculta: $('oculta').checked,
      telefono: $('telefono').value, pais: $('pais').value, mensaje: $('mensaje').value,
      email: $('email').value, asunto: $('asunto').value, cuerpo: $('cuerpo').value
    };
  }

  function dibujar(c, qr, size, color, fondo) {
    var n = qr.getModuleCount(), total = n + 8;
    var scale = size / total;
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    ctx.fillStyle = fondo; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = color;
    for (var r = 0; r < n; r++) {
      for (var col = 0; col < n; col++) {
        if (qr.isDark(r, col)) ctx.fillRect(Math.floor((col + 4) * scale), Math.floor((r + 4) * scale), Math.ceil(scale), Math.ceil(scale));
      }
    }
  }

  function generar() {
    $('form-error').textContent = '';
    Array.prototype.forEach.call(document.querySelectorAll('.qr-fields'), function (f) { f.hidden = f.getAttribute('data-tipo') !== tipo(); });
    var contenido;
    try { contenido = Q.payload(tipo(), datos()); } catch (e) {
      actual = null;
      $('qr-contenido').textContent = 'Completá los datos para ver tu QR.';
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      $('descargar-png').disabled = $('descargar-svg').disabled = true;
      return;
    }
    var qr;
    try {
      qr = qrcode(0, $('nivel').value);
      qr.addData(contenido, 'Byte');
      qr.make();
    } catch (e) {
      $('form-error').textContent = 'El contenido es demasiado largo para un código QR. Acortalo o bajá el nivel de corrección.';
      return;
    }
    actual = { qr: qr, contenido: contenido };
    dibujar(canvas, qr, 280 * (window.devicePixelRatio > 1 ? 2 : 1), $('color').value, $('fondo').value);
    $('qr-contenido').textContent = contenido;
    $('descargar-png').disabled = $('descargar-svg').disabled = false;
  }

  function descargar(blob, nombre) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  $('descargar-png').addEventListener('click', function () {
    if (!actual) return;
    var c = document.createElement('canvas');
    dibujar(c, actual.qr, parseInt($('tamano').value, 10), $('color').value, $('fondo').value);
    c.toBlob(function (b) { descargar(b, 'qr-' + tipo() + '.png'); }, 'image/png');
  });
  $('descargar-svg').addEventListener('click', function () {
    if (!actual) return;
    var svg = Q.toSvg(actual.qr.getModuleCount(), function (r, c) { return actual.qr.isDark(r, c); }, { color: $('color').value, fondo: $('fondo').value });
    descargar(new Blob([svg], { type: 'image/svg+xml' }), 'qr-' + tipo() + '.svg');
  });

  form.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(generar, 150); });
  form.addEventListener('change', generar);
  form.addEventListener('submit', function (e) { e.preventDefault(); generar(); });
  generar();
})();
