/* Feriados y días hábiles de Argentina (calendario oficial).
   Funciona en el navegador (window.CTFeriados) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTFeriados = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  var DAY = 86400000;
  function t(iso) { var p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  // Tipos que no son hábiles: feriados inamovibles y trasladables siempre; turísticos según la opción
  function noHabiles(lista, turisticos) {
    var set = {};
    lista.forEach(function (f) {
      if (f.tipo === 'inamovible' || f.tipo === 'trasladable' || (turisticos && f.tipo === 'turistico')) set[f.fecha] = f;
    });
    return set;
  }
  function esHabil(ms, set) { var w = new Date(ms).getUTCDay(); return w !== 0 && w !== 6 && !set[iso(ms)]; }

  /** Días hábiles entre dos fechas, ambas incluidas */
  function diasHabiles(desde, hasta, lista, opts) {
    if (t(hasta) < t(desde)) throw new Error('La fecha final debe ser posterior a la inicial.');
    var set = noHabiles(lista, !opts || opts.turisticos !== false);
    var n = 0, corridos = 0, feriados = [];
    for (var ms = t(desde); ms <= t(hasta); ms += DAY) {
      corridos++;
      if (esHabil(ms, set)) n++;
      else if (set[iso(ms)]) feriados.push(set[iso(ms)]);
    }
    return { habiles: n, corridos: corridos, feriados: feriados };
  }

  /** Fecha que resulta de sumar n días hábiles a una fecha (sin contar la fecha inicial) */
  function sumarHabiles(desde, n, lista, opts) {
    if (!(n >= 1)) throw new Error('Ingresá una cantidad de días hábiles.');
    var set = noHabiles(lista, !opts || opts.turisticos !== false);
    var ms = t(desde), c = 0;
    while (c < n) { ms += DAY; if (esHabil(ms, set)) c++; }
    return iso(ms);
  }

  /** Próximos feriados desde una fecha (incluida), excluyendo los no laborables religiosos */
  function proximos(desde, lista, cantidad) {
    return lista.filter(function (f) { return f.fecha >= desde && f.tipo !== 'no_laborable'; }).slice(0, cantidad || 3)
      .map(function (f) { return { fecha: f.fecha, nombre: f.nombre, tipo: f.tipo, faltan: Math.round((t(f.fecha) - t(desde)) / DAY) }; });
  }
  return { diasHabiles: diasHabiles, sumarHabiles: sumarHabiles, proximos: proximos };
});
