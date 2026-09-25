/* Simulador de préstamo: sistema francés (cuota fija) o alemán (amortización fija), con IVA opcional sobre intereses. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTPrestamo = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }

  /**
   * @param {object} p { monto, cuotas, tna (%), sistema ('frances'|'aleman'), iva (bool: 21 % sobre intereses) }
   * La tasa mensual se calcula como TNA ÷ 12, como informan la mayoría de los bancos.
   */
  function calcular(p) {
    if (!(p.monto > 0)) throw new Error('Ingresá el monto del préstamo.');
    if (!(p.cuotas >= 1 && p.cuotas <= 360) || Math.floor(p.cuotas) !== p.cuotas) throw new Error('Ingresá una cantidad de cuotas entre 1 y 360.');
    if (!(p.tna >= 0 && p.tna < 1000)) throw new Error('Ingresá la tasa nominal anual (TNA).');
    var i = p.tna / 100 / 12;
    var n = p.cuotas;
    var ivaTasa = p.iva ? 0.21 : 0;
    var cuotaFija = i === 0 ? p.monto / n : p.monto * i / (1 - Math.pow(1 + i, -n));
    var amortFija = p.monto / n;
    var saldo = p.monto, filas = [], totalInteres = 0, totalIva = 0, totalPagado = 0;
    for (var k = 1; k <= n; k++) {
      var interes = saldo * i;
      var amort = p.sistema === 'aleman' ? amortFija : cuotaFija - interes;
      if (k === n) amort = saldo; // ajuste final por redondeos
      var iva = interes * ivaTasa;
      var cuota = amort + interes + iva;
      saldo -= amort;
      totalInteres += interes; totalIva += iva; totalPagado += cuota;
      filas.push({ numero: k, cuota: r2(cuota), interes: r2(interes), iva: r2(iva), amortizacion: r2(amort), saldo: r2(Math.max(0, saldo)) });
    }
    // Costo efectivo con IVA: tasa mensual que iguala las cuotas con el monto recibido
    var tem = tasaInterna(p.monto, filas.map(function (f) { return f.cuota; }));
    return {
      primeraCuota: filas[0].cuota,
      ultimaCuota: filas[n - 1].cuota,
      totalPagado: r2(totalPagado),
      totalInteres: r2(totalInteres),
      totalIva: r2(totalIva),
      tem: r2(i * 100 * 1000) / 1000,
      tea: r2((Math.pow(1 + i, 12) - 1) * 100),
      costoEfectivoAnual: r2((Math.pow(1 + tem, 12) - 1) * 100),
      filas: filas
    };
  }

  function tasaInterna(monto, cuotas) {
    var lo = 0, hi = 1;
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2, vp = 0;
      for (var j = 0; j < cuotas.length; j++) vp += cuotas[j] / Math.pow(1 + mid, j + 1);
      if (vp > monto) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  return { calcular: calcular };
});
