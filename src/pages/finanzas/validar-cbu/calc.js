/* Validación de CBU y CVU (dígitos verificadores) e identificación de la entidad.
   Funciona en el navegador (window.CTCbu) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTCbu = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  function dv(digitos, pesos) {
    var s = 0;
    for (var i = 0; i < digitos.length; i++) s += +digitos[i] * pesos[i % pesos.length];
    return (10 - (s % 10)) % 10;
  }
  /** @param {string} valor · @param {object} entidades código de 3 dígitos → nombre */
  function validar(valor, entidades) {
    var c = String(valor || '').replace(/\D/g, '');
    if (c.length !== 22) return { valido: false, motivo: 'Un CBU o CVU tiene 22 dígitos (tiene ' + c.length + ').' };
    var b1 = c.slice(0, 8), b2 = c.slice(8);
    var ok1 = dv(b1.slice(0, 7), [7, 1, 3, 9]) === +b1[7];
    var ok2 = dv(b2.slice(0, 13), [3, 9, 7, 1]) === +b2[13];
    var esCvu = c.slice(0, 3) === '000';
    var codigo = c.slice(0, 3);
    return {
      valido: ok1 && ok2,
      bloque1: ok1, bloque2: ok2,
      tipo: esCvu ? 'CVU' : 'CBU',
      codigo: codigo,
      entidad: esCvu ? null : ((entidades || {})[codigo] || null),
      sucursal: esCvu ? null : c.slice(3, 7),
      motivo: ok1 && ok2 ? '' : (!ok1 ? 'El primer bloque (entidad y sucursal) no es válido.' : 'El segundo bloque (número de cuenta) no es válido.')
    };
  }
  return { validar: validar, dv: dv };
});
