/* Cálculo y validación de CUIL/CUIT (algoritmo de dígito verificador módulo 11).
   Funciona en el navegador (window.CTCuit) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTCuit = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  var PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  function dv(base10) {
    var s = 0;
    for (var i = 0; i < 10; i++) s += +base10[i] * PESOS[i];
    var r = 11 - (s % 11);
    return r === 11 ? 0 : r; // 10 = no válido con ese prefijo
  }
  function formato(c) { return c.slice(0, 2) + '-' + c.slice(2, 10) + '-' + c.slice(10); }

  /** @param {string} dni · @param {string} tipo 'hombre' | 'mujer' | 'empresa' */
  function calcular(dni, tipo) {
    var d = String(dni || '').replace(/\D/g, '');
    if (d.length < 7 || d.length > 8) throw new Error('Ingresá un DNI de 7 u 8 dígitos.');
    d = d.padStart(8, '0');
    var pref = tipo === 'mujer' ? '27' : tipo === 'empresa' ? '30' : '20';
    var v = dv(pref + d);
    if (v === 10) {
      // Si el dígito da 10 se cambia el prefijo: 23 (con dígito 9 para hombres y 4 para mujeres) o 33 para empresas
      if (tipo === 'empresa') { pref = '33'; v = dv(pref + d); }
      else { pref = '23'; v = tipo === 'mujer' ? 4 : 9; }
    }
    var cuit = pref + d + v;
    return { cuit: cuit, formateado: formato(cuit), prefijo: pref };
  }

  function validar(valor) {
    var c = String(valor || '').replace(/\D/g, '');
    if (c.length !== 11) return { valido: false, motivo: 'Debe tener 11 dígitos.' };
    if (['20', '23', '24', '25', '26', '27', '30', '33', '34'].indexOf(c.slice(0, 2)) === -1) return { valido: false, motivo: 'El prefijo ' + c.slice(0, 2) + ' no es válido.' };
    var v = dv(c.slice(0, 10));
    var ok = v !== 10 && v === +c[10];
    return { valido: ok, formateado: formato(c), motivo: ok ? '' : 'El dígito verificador no coincide (debería ser ' + (v === 10 ? '—' : v) + ').' };
  }
  return { calcular: calcular, validar: validar };
});
