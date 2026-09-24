/* ¿Cuotas o contado? Valor presente de las cuotas descontadas por inflación (o por otra tasa) y tasa implícita.
   Funciona en el navegador (window.CTCuotas) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTCuotas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function r2(n) { return Math.round(n * 100) / 100; }

  // Valor hoy de una serie de pagos iguales, descontados a una tasa mensual (decimal)
  function valorPresente(cuota, n, tasa, primerMes) {
    var vp = 0;
    for (var i = 0; i < n; i++) vp += cuota / Math.pow(1 + tasa, primerMes + i);
    return vp;
  }

  // Tasa mensual que iguala el valor presente de las cuotas con el precio de contado (bisección)
  function tasaImplicita(precio, cuota, n, primerMes) {
    if (cuota * n <= precio + 1e-9) {
      // Sin recargo (o con descuento): la tasa es cero o negativa
      if (Math.abs(cuota * n - precio) < 0.005) return 0;
    }
    var lo = -0.99, hi = 10;
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2;
      if (valorPresente(cuota, n, mid, primerMes) > precio) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * @param {object} p { contado, cuotas, valorCuota, tasaMensual (en %, ej. 2.5), primerMes (0 = hoy, 1 = en un mes) }
   */
  function calcular(p) {
    if (!(p.contado > 0)) throw new Error('Ingresá el precio de contado.');
    if (!(p.cuotas >= 1 && p.cuotas <= 120) || Math.floor(p.cuotas) !== p.cuotas) throw new Error('Ingresá una cantidad de cuotas entre 1 y 120.');
    if (!(p.valorCuota > 0)) throw new Error('Ingresá el valor de cada cuota.');
    if (!(p.tasaMensual > -100)) throw new Error('Ingresá la inflación o tasa mensual.');
    var primerMes = p.primerMes === 0 ? 0 : 1;
    var tasa = p.tasaMensual / 100;
    var filas = [];
    var vp = 0;
    for (var i = 0; i < p.cuotas; i++) {
      var mes = primerMes + i;
      var hoy = p.valorCuota / Math.pow(1 + tasa, mes);
      vp += hoy;
      filas.push({ numero: i + 1, mes: mes, cuota: r2(p.valorCuota), valorHoy: r2(hoy) });
    }
    var total = p.valorCuota * p.cuotas;
    var diferencia = p.contado - vp; // > 0: las cuotas cuestan menos que el contado en pesos de hoy
    var tem = tasaImplicita(p.contado, p.valorCuota, p.cuotas, primerMes);
    var conviene = Math.abs(diferencia) < 0.005 * p.contado ? 'igual' : (diferencia > 0 ? 'cuotas' : 'contado');
    return {
      totalCuotas: r2(total),
      recargo: r2((total / p.contado - 1) * 100),
      valorPresente: r2(vp),
      diferencia: r2(diferencia),
      diferenciaPct: r2((diferencia / p.contado) * 100),
      conviene: conviene,
      temImplicita: r2(tem * 100),
      teaImplicita: r2((Math.pow(1 + tem, 12) - 1) * 100),
      filas: filas
    };
  }

  // Promedio geométrico mensual de una lista de variaciones (en %)
  function promedioMensual(variaciones) {
    var f = variaciones.reduce(function (acc, v) { return acc * (1 + v / 100); }, 1);
    return (Math.pow(f, 1 / variaciones.length) - 1) * 100;
  }

  return { calcular: calcular, valorPresente: valorPresente, tasaImplicita: tasaImplicita, promedioMensual: promedioMensual };
});
