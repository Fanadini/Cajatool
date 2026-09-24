/* Conversión de horarios entre zonas IANA con Intl.DateTimeFormat (incluye horario de verano).
   Funciona en el navegador (window.CTHusos) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTHusos = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MIN = 60000;
  var cache = {};

  function partsFormatter(zone) {
    if (!cache[zone]) {
      cache[zone] = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    return cache[zone];
  }

  // Fecha y hora local de un instante en una zona
  function wallTime(date, zone) {
    var o = {};
    partsFormatter(zone).formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, min: +o.minute, s: +o.second };
  }

  // Diferencia con UTC en minutos (ej.: Buenos Aires = -180)
  function offsetMinutes(zone, date) {
    var w = wallTime(date, zone);
    var asUtc = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min, w.s);
    return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / MIN);
  }

  // Instante (Date) que corresponde a "YYYY-MM-DDTHH:MM" en la zona indicada
  function zonedToDate(local, zone) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
    if (!m) throw new Error('Fecha u hora no válida.');
    var guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    // Dos iteraciones alcanzan para resolver el cambio de horario
    var t = guess - offsetMinutes(zone, new Date(guess)) * MIN;
    t = guess - offsetMinutes(zone, new Date(t)) * MIN;
    return new Date(t);
  }

  // ¿Está en horario de verano? (su diferencia con UTC es mayor que la mínima del año)
  function isDST(zone, date) {
    var y = wallTime(date, zone).y;
    var jan = offsetMinutes(zone, new Date(Date.UTC(y, 0, 1)));
    var jul = offsetMinutes(zone, new Date(Date.UTC(y, 6, 1)));
    if (jan === jul) return false;
    return offsetMinutes(zone, date) === Math.max(jan, jul);
  }

  function formatOffset(min) {
    var sign = min < 0 ? '−' : '+';
    var a = Math.abs(min);
    var h = Math.floor(a / 60), m = a % 60;
    return 'UTC' + sign + h + (m ? ':' + String(m).padStart(2, '0') : '');
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /**
   * Convierte una hora local de una zona a varias zonas.
   * @returns {Array<{zone, fecha: 'YYYY-MM-DD', hora: 'HH:MM', offset, offsetTexto, verano, diaRelativo}>}
   */
  function convertir(local, zonaOrigen, zonas) {
    var date = zonedToDate(local, zonaOrigen);
    var base = wallTime(date, zonaOrigen);
    var baseDay = Date.UTC(base.y, base.m - 1, base.d);
    return zonas.map(function (z) {
      var w = wallTime(date, z);
      var off = offsetMinutes(z, date);
      return {
        zone: z,
        fecha: w.y + '-' + pad(w.m) + '-' + pad(w.d),
        hora: pad(w.h) + ':' + pad(w.min),
        offset: off,
        offsetTexto: formatOffset(off),
        verano: isDST(z, date),
        diaRelativo: Math.round((Date.UTC(w.y, w.m - 1, w.d) - baseDay) / 86400000)
      };
    });
  }

  return { convertir: convertir, offsetMinutes: offsetMinutes, zonedToDate: zonedToDate, isDST: isDST, formatOffset: formatOffset };
});
