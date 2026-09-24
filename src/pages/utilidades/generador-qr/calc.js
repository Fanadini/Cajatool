/* Armado del contenido de cada tipo de QR (URL, texto, WiFi, WhatsApp y email).
   Funciona en el navegador (window.CTQR) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTQR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // En el formato WIFI: se escapan \ ; , : y "
  function escWifi(s) { return String(s).replace(/([\;,:"])/g, '\\$1'); }

  function payload(tipo, d) {
    d = d || {};
    switch (tipo) {
      case 'url': {
        var u = String(d.url || '').trim();
        if (!u) throw new Error('Ingresá una dirección web.');
        if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
        return u;
      }
      case 'texto': {
        if (!d.texto) throw new Error('Escribí el texto del QR.');
        return String(d.texto);
      }
      case 'wifi': {
        if (!d.ssid) throw new Error('Ingresá el nombre de la red.');
        var seg = d.seguridad || 'WPA';
        var s = 'WIFI:T:' + (seg === 'nopass' ? 'nopass' : seg) + ';S:' + escWifi(d.ssid) + ';';
        if (seg !== 'nopass') {
          if (!d.password) throw new Error('Ingresá la contraseña de la red.');
          s += 'P:' + escWifi(d.password) + ';';
        }
        if (d.oculta) s += 'H:true;';
        return s + ';';
      }
      case 'whatsapp': {
        var num = String(d.telefono || '').replace(/\D/g, '');
        if (num.length < 8) throw new Error('Ingresá el número con código de país y de área.');
        // Números argentinos cargados como 11 1234-5678 o 011 15…: se agrega 549
        if (d.pais === 'AR') {
          num = num.replace(/^0/, '');
          if (!/^54/.test(num)) num = '549' + num.replace(/^(\d{2,4})15/, '$1');
        }
        return 'https://wa.me/' + num + (d.mensaje ? '?text=' + encodeURIComponent(d.mensaje) : '');
      }
      case 'email': {
        var to = String(d.email || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error('Ingresá un email válido.');
        var q = [];
        if (d.asunto) q.push('subject=' + encodeURIComponent(d.asunto));
        if (d.cuerpo) q.push('body=' + encodeURIComponent(d.cuerpo));
        return 'mailto:' + to + (q.length ? '?' + q.join('&') : '');
      }
    }
    throw new Error('Tipo de QR desconocido.');
  }

  // SVG a partir de una matriz de módulos (isDark(fila, col)), con margen de 4 módulos
  function toSvg(count, isDark, opts) {
    opts = opts || {};
    var margin = 4, size = count + margin * 2;
    var fg = opts.color || '#000000', bg = opts.fondo || '#ffffff';
    var d = '';
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (isDark(r, c)) d += 'M' + (c + margin) + ' ' + (r + margin) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="' + bg + '"/><path fill="' + fg + '" d="' + d + '"/></svg>';
  }

  return { payload: payload, toSvg: toSvg };
});
