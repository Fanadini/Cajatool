/* Formato numérico argentino. Funciona en el navegador (window.CTFormat) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTFormat = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var num2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // $ 1.234.567,89 (con espacio normal en lugar del espacio duro de Intl)
  function fmtMoney(n) {
    if (!isFinite(n)) return '—';
    return money.format(n).replace(/ /g, ' ');
  }
  function fmtNumber(n, decimals) {
    if (!isFinite(n)) return '—';
    if (decimals === undefined) return num2.format(n);
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
  }
  function fmtPercent(n, decimals) {
    return fmtNumber(n, decimals === undefined ? 2 : decimals) + ' %';
  }
  // Acepta "1.234.567,89", "1234567.89", "$ 1.234", "1234,5". Devuelve NaN si no es número.
  function parseAR(str) {
    if (typeof str === 'number') return str;
    if (str === null || str === undefined) return NaN;
    var s = String(str).replace(/[$\s %]/g, '');
    if (s === '') return NaN;
    var hasComma = s.indexOf(',') !== -1;
    if (hasComma) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // Sin coma: los puntos seguidos de exactamente 3 dígitos son separadores de miles
      var parts = s.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) s = parts.join('');
    }
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }
  return { fmtMoney: fmtMoney, fmtNumber: fmtNumber, fmtPercent: fmtPercent, parseAR: parseAR, round2: round2 };
});
