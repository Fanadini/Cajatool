/* Rendimiento de un plazo fijo tradicional y comparación con la inflación.
   Funciona en el navegador (window.CTPlazoFijo) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTPlazoFijo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function r2(n) { return Math.round(n * 100) / 100; }

  /**
   * @param {object} p { capital, dias (≥ 30), tna (%), inflacionMensual (%), renovar (bool: reinvertir capital + intereses) }
   *  Con renovar = true, "dias" es el plazo de cada renovación y "meses" la cantidad total de meses.
   */
  function calcular(p) {
    if (!(p.capital > 0)) throw new Error('Ingresá el monto a invertir.');
    if (!(p.dias >= 30 && p.dias <= 3650)) throw new Error('El plazo mínimo es de 30 días.');
    if (!(p.tna >= 0 && p.tna < 1000)) throw new Error('Ingresá la tasa nominal anual (TNA).');
    var tasaPeriodo = p.tna / 100 * p.dias / 365;
    var periodos = p.renovar ? Math.max(1, Math.round((p.meses || 12) * 30 / p.dias)) : 1;
    var monto = p.capital;
    var filas = [];
    for (var i = 1; i <= periodos; i++) {
      var interes = monto * tasaPeriodo;
      monto += interes;
      filas.push({ numero: i, dia: i * p.dias, interes: r2(interes), monto: r2(monto) });
    }
    var diasTotales = periodos * p.dias;
    var rendimiento = monto / p.capital - 1;
    var inflacion = Math.pow(1 + (p.inflacionMensual || 0) / 100, diasTotales / 30) - 1;
    var real = (1 + rendimiento) / (1 + inflacion) - 1;
    return {
      interes: r2(monto - p.capital),
      montoFinal: r2(monto),
      diasTotales: diasTotales,
      tem: r2(p.tna / 100 * 30 / 365 * 100 * 1000) / 1000,
      tea: r2((Math.pow(1 + tasaPeriodo, 365 / p.dias) - 1) * 100),
      rendimiento: r2(rendimiento * 100),
      inflacionPeriodo: r2(inflacion * 100),
      rendimientoReal: r2(real * 100),
      montoEnPesosDeHoy: r2(monto / (1 + inflacion)),
      leGana: real > 0,
      filas: filas
    };
  }

  return { calcular: calcular };
});
