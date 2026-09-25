/* Índice de masa corporal (IMC) con la clasificación de la OMS para adultos.
   Funciona en el navegador (window.CTImc) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTImc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var CATEGORIAS = [
    { max: 18.5, nombre: 'Bajo peso' },
    { max: 25, nombre: 'Peso normal' },
    { max: 30, nombre: 'Sobrepeso' },
    { max: 35, nombre: 'Obesidad grado I' },
    { max: 40, nombre: 'Obesidad grado II' },
    { max: Infinity, nombre: 'Obesidad grado III' }
  ];
  function r1(n) { return Math.round(n * 10) / 10; }
  function calcular(peso, alturaCm) {
    if (!(peso >= 2 && peso <= 400)) throw new Error('Ingresá tu peso en kilos.');
    if (!(alturaCm >= 50 && alturaCm <= 250)) throw new Error('Ingresá tu altura en centímetros.');
    var h = alturaCm / 100, imc = peso / (h * h);
    var i = 0; while (imc >= CATEGORIAS[i].max) i++;
    return { imc: r1(imc), categoria: CATEGORIAS[i].nombre, indice: i, pesoMin: r1(18.5 * h * h), pesoMax: r1(24.9 * h * h) };
  }
  return { calcular: calcular, CATEGORIAS: CATEGORIAS };
});
