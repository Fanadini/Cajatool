(function () {
  'use strict';
  var F = window.CTFormat, R = window.CTReglaTres;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-r3'), calculado = false;
  function n(v) { return new Intl.NumberFormat('es-AR', { maximumFractionDigits: Math.abs(v) >= 100 ? 2 : 4 }).format(v); }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var tipo = form.querySelector('input[name="tipo"]:checked').value;
    var a = F.parseAR($('a').value), b = F.parseAR($('b').value), c = F.parseAR($('c').value), x;
    try { x = R[tipo](a, b, c); } catch (e) { $('form-error').textContent = e.message; $('x').textContent = '?'; return; }
    $('x').textContent = n(x); $('res-main').textContent = n(x);
    var cuenta = tipo === 'directa' ? n(b) + ' × ' + n(c) + ' ÷ ' + n(a) : n(a) + ' × ' + n(b) + ' ÷ ' + n(c);
    $('res-explica').textContent = 'Regla de tres ' + tipo + ': X = ' + cuenta + ' = ' + n(x) + '.';
    $('res-resumen').textContent = 'Si ' + n(a) + ' es ' + n(b) + ', entonces ' + n(c) + ' es ' + n(x) + ' (regla de tres ' + tipo + ').';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
