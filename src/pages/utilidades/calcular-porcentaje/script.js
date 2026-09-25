(function () {
  'use strict';
  var F = window.CTFormat, P = window.CTPorcentaje;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-pct'), calculado = false;
  var LABELS = {
    deX: ['Porcentaje (%)', 'Número'], que: ['Parte', 'Total'], aplicar: ['Número', 'Porcentaje (%)'],
    variacion: ['Valor inicial', 'Valor final'], original: ['Valor final', 'Porcentaje (%)']
  };
  function n(v) { return new Intl.NumberFormat('es-AR', { maximumFractionDigits: Math.abs(v) >= 100 ? 2 : 4 }).format(v); }
  function labels() {
    var m = $('modo').value; $('la').textContent = LABELS[m][0]; $('lb').textContent = LABELS[m][1];
    $('f-tipo').hidden = !(m === 'aplicar' || m === 'original');
  }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var m = $('modo').value, a = F.parseAR($('a').value), b = F.parseAR($('b').value), s = +$('tipo').value, main, exp;
    if (!isFinite(a) || !isFinite(b) || $('a').value.trim() === '' || $('b').value.trim() === '') { $('form-error').textContent = 'Completá los dos valores.'; return; }
    try {
      if (m === 'deX') { var x = P.deX(a, b); main = n(x); exp = 'El ' + n(a) + ' % de ' + n(b) + ' es ' + n(x) + '.'; }
      else if (m === 'que') { var q = P.quePorcentaje(a, b); main = n(q) + ' %'; exp = n(a) + ' es el ' + n(q) + ' % de ' + n(b) + '.'; }
      else if (m === 'variacion') { var v = P.variacion(a, b); main = (v > 0 ? '+' : '') + n(v) + ' %'; exp = 'De ' + n(a) + ' a ' + n(b) + ' hay ' + (v >= 0 ? 'un aumento' : 'una baja') + ' del ' + n(Math.abs(v)) + ' % (diferencia: ' + n(b - a) + ').'; }
      else if (m === 'aplicar') { var r = P.aplicar(a, s * b); main = n(r.resultado); exp = n(a) + (s > 0 ? ' con un aumento' : ' con un descuento') + ' del ' + n(b) + ' % da ' + n(r.resultado) + ' (' + (s > 0 ? '+' : '−') + n(Math.abs(r.diferencia)) + ').'; }
      else { var o = P.original(a, s * b); main = n(o); exp = 'Antes ' + (s > 0 ? 'del aumento' : 'del descuento') + ' del ' + n(b) + ' %, el valor era ' + n(o) + ' (diferencia: ' + n(Math.abs(a - o)) + ').'; }
    } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-main').textContent = main; $('res-explica').textContent = exp; $('res-resumen').textContent = exp;
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function (e) {
    if (e.target.id === 'modo') { labels(); $('resultado').hidden = true; calculado = false; return; }
    if (calculado) calcular(false);
  });
  labels();
})();
