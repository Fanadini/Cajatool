/* Días entre fechas, sumar días y calculadora de edad. Fechas ISO (AAAA-MM-DD) en UTC.
   Funciona en el navegador (window.CTFechas) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTFechas = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var DIA = 86400000;
  function parse(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) throw new Error('Ingresá una fecha válida.');
    var p = s.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    if (d.getUTCMonth() !== p[1] - 1) throw new Error('Ingresá una fecha válida.');
    return d;
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function diasDelMes(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  // Diferencia en años, meses y días (de a hacia b, a <= b)
  function ymd(a, b) {
    var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) { m--; d += diasDelMes(b.getUTCFullYear(), b.getUTCMonth() - 1); }
    if (m < 0) { y--; m += 12; }
    return { anios: y, meses: m, dias: d };
  }
  function diferencia(desde, hasta, incluirUltimo) {
    var a = parse(desde), b = parse(hasta), signo = b >= a ? 1 : -1;
    if (signo < 0) { var t = a; a = b; b = t; }
    var dias = Math.round((b - a) / DIA) + (incluirUltimo ? 1 : 0);
    var res = ymd(a, b);
    return { dias: dias * signo, semanas: Math.floor(dias / 7), restoDias: dias % 7, anios: res.anios, meses: res.meses, diasYmd: res.dias, pasado: signo < 0 };
  }
  function sumar(fecha, n) {
    if (typeof n !== 'number' || !isFinite(n)) throw new Error('Ingresá la cantidad de días.');
    return iso(new Date(parse(fecha).getTime() + Math.round(n) * DIA));
  }
  function edad(nacimiento, hoy) {
    var a = parse(nacimiento), b = parse(hoy);
    if (a > b) throw new Error('La fecha de nacimiento no puede ser posterior a hoy.');
    var e = ymd(a, b), y = b.getUTCFullYear();
    var cumple = function (anio) { var dm = diasDelMes(anio, a.getUTCMonth()); return new Date(Date.UTC(anio, a.getUTCMonth(), Math.min(a.getUTCDate(), dm))); };
    var prox = cumple(y); if (prox < b) prox = cumple(y + 1);
    return { anios: e.anios, meses: e.meses, dias: e.dias, totalDias: Math.round((b - a) / DIA), proximoCumple: iso(prox), faltan: Math.round((prox - b) / DIA), diaSemana: a.getUTCDay() };
  }
  return { diferencia: diferencia, sumar: sumar, edad: edad };
});
