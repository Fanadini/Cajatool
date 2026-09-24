/* Cálculo de ajustes de alquiler por ICL, IPC, Casa Propia o porcentaje fijo.
   Funciona en el navegador (window.CTAlquiler) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTAlquiler = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY = 86400000;

  function parseDate(iso) {
    var p = iso.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function iso(d) { return d.toISOString().slice(0, 10); }

  // Suma meses respetando fin de mes (31/01 + 1 mes = 28/02 o 29/02)
  function addMonths(isoDate, n) {
    var d = parseDate(isoDate);
    var day = d.getUTCDate();
    var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
    var last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    t.setUTCDate(Math.min(day, last));
    return iso(t);
  }
  function monthKey(isoDate, offset) {
    var d = parseDate(isoDate);
    var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (offset || 0), 1));
    return iso(t).slice(0, 7);
  }

  // ICL del día (serie diaria continua desde data.icl.desde)
  function iclValue(icl, isoDate) {
    var i = Math.round((parseDate(isoDate) - parseDate(icl.desde)) / DAY);
    if (i < 0 || i >= icl.valores.length) return null;
    return icl.valores[i];
  }

  // Factor de ajuste de un período [desde, hasta) para cada índice.
  // Devuelve { factor, detalle } o null si todavía no hay datos publicados.
  function factorPeriodo(indice, desde, hasta, opts, data) {
    if (indice === 'fijo') {
      return { factor: 1 + opts.porcentaje / 100, detalle: 'Porcentaje pactado' };
    }
    if (indice === 'icl') {
      var a = iclValue(data.icl, desde);
      var b = iclValue(data.icl, hasta);
      if (a === null || b === null) return null;
      return { factor: b / a, detalle: 'ICL ' + desde + ': ' + a + ' → ' + hasta + ': ' + b };
    }
    if (indice === 'ipc') {
      // Meses del período: del mes de inicio al mes anterior al ajuste, corridos "desfase" meses hacia atrás
      var lag = opts.desfase || 0;
      var mDesde = monthKey(desde, -1 - lag); // nivel de cierre del mes previo al período
      var mHasta = monthKey(hasta, -1 - lag); // nivel del último mes que se toma
      var n = data.ipc.niveles;
      if (!(mDesde in n) || !(mHasta in n)) return null;
      return {
        factor: n[mHasta] / n[mDesde],
        detalle: 'IPC ' + monthKey(desde, -lag) + ' a ' + mHasta
      };
    }
    if (indice === 'casapropia') {
      // Se multiplica el monto del mes anterior por el coeficiente de cada mes: meses (desde+1) … hasta
      var c = data.casaPropia.coeficientes;
      var f = 1;
      var meses = Math.round(monthsBetween(desde, hasta));
      for (var i = 1; i <= meses; i++) {
        var k = monthKey(desde, i);
        if (!(k in c)) return null;
        f *= c[k];
      }
      return { factor: f, detalle: 'Casa Propia ' + monthKey(desde, 1) + ' a ' + monthKey(hasta) };
    }
    throw new Error('Índice desconocido: ' + indice);
  }

  function monthsBetween(a, b) {
    var da = parseDate(a), db = parseDate(b);
    return (db.getUTCFullYear() - da.getUTCFullYear()) * 12 + db.getUTCMonth() - da.getUTCMonth();
  }

  /**
   * @param {object} p { monto, inicio (YYYY-MM-DD), frecuencia (meses), duracion (meses), indice, porcentaje, desfase }
   * @param {object} data contenido de data/indices.json
   * @returns {{ periodos: Array, ultimoCalculado: object, pendientes: number }}
   */
  function calcular(p, data) {
    if (!(p.monto > 0)) throw new Error('El monto inicial debe ser mayor a cero.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.inicio || '')) throw new Error('La fecha de inicio no es válida.');
    if ([1, 2, 3, 4, 6, 12].indexOf(p.frecuencia) === -1) throw new Error('Frecuencia no válida.');
    if (p.indice === 'fijo' && !(p.porcentaje >= 0)) throw new Error('Ingresá el porcentaje de aumento.');
    var duracion = p.duracion || 24;
    var periodos = [];
    var monto = p.monto;
    var pendiente = false;
    var n = Math.ceil(duracion / p.frecuencia);
    for (var i = 0; i < n; i++) {
      var desde = addMonths(p.inicio, i * p.frecuencia);
      var hasta = addMonths(p.inicio, Math.min((i + 1) * p.frecuencia, duracion));
      var fila = { numero: i + 1, desde: desde, hasta: addMonthsMinusDay(hasta), factor: 1, variacion: 0, monto: null, estado: 'ok', detalle: '' };
      if (i > 0) {
        var prevDesde = addMonths(p.inicio, (i - 1) * p.frecuencia);
        var r = pendiente ? null : factorPeriodo(p.indice, prevDesde, desde, p, data);
        if (!r) {
          pendiente = true;
          fila.estado = 'pendiente';
          fila.factor = null;
          fila.variacion = null;
          periodos.push(fila);
          continue;
        }
        monto = monto * r.factor;
        fila.factor = r.factor;
        fila.variacion = (r.factor - 1) * 100;
        fila.detalle = r.detalle;
      } else {
        fila.detalle = 'Monto inicial';
      }
      fila.monto = Math.round(monto * 100) / 100;
      periodos.push(fila);
    }
    var calculados = periodos.filter(function (f) { return f.estado === 'ok'; });
    var ultimo = calculados[calculados.length - 1];
    return {
      periodos: periodos,
      ultimoCalculado: ultimo,
      pendientes: periodos.length - calculados.length,
      aumentoTotal: (ultimo.monto / p.monto - 1) * 100
    };
  }

  function addMonthsMinusDay(isoDate) {
    return iso(new Date(parseDate(isoDate).getTime() - DAY));
  }

  // Período vigente en una fecha (para destacar "lo que pagás hoy")
  function periodoVigente(res, hoyIso) {
    for (var i = 0; i < res.periodos.length; i++) {
      var f = res.periodos[i];
      if (f.desde <= hoyIso && hoyIso <= f.hasta) return f;
    }
    return null;
  }

  return { calcular: calcular, factorPeriodo: factorPeriodo, addMonths: addMonths, iclValue: iclValue, periodoVigente: periodoVigente };
});
