(function () {
  'use strict';
  var F = window.CTFormat, M = window.CTMateriales;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-mat'), calculado = false;
  var n = function (id) { return F.parseAR($(id).value); };
  function modo() { return form.querySelector('input[name="modo"]:checked').value; }
  function toggles() { Array.prototype.forEach.call(form.querySelectorAll('[data-modo]'), function (el) { el.hidden = el.getAttribute('data-modo') !== modo(); }); }
  function mostrar(label, main, explica, resumen) {
    $('res-label').textContent = label; $('res-main').textContent = main; $('res-explica').textContent = explica; $('res-resumen').textContent = resumen;
  }
  function calcular(scroll) {
    $('form-error').textContent = '';
    try {
      if (modo() === 'pintura') {
        var lata = +$('lata').value;
        var r = M.pintura({ perimetro: n('perimetro'), alto: n('alto'), aberturas: n('aberturas') || 0, manos: +$('manos').value, rendimiento: n('rendimiento') || 10, lata: lata, techo: $('techo').checked, superficieTecho: n('sup-techo') || 0 });
        var latas = r.latas + (r.latas === 1 ? ' lata' : ' latas') + ' de ' + lata + (lata === 1 ? ' litro' : ' litros');
        mostrar('Pintura necesaria', F.fmtNumber(r.litros, 2) + ' litros', 'Superficie a pintar: ' + F.fmtNumber(r.superficie, 2) + ' m². Comprá ' + latas + '.', 'Para pintar ' + F.fmtNumber(r.superficie, 2) + ' m² necesito ' + F.fmtNumber(r.litros, 2) + ' litros (' + latas + ').');
      } else if (modo() === 'pisos') {
        var p = M.pisos({ superficie: n('superficie'), m2Caja: n('m2caja'), desperdicio: +$('desperdicio').value });
        mostrar('Cajas necesarias', p.cajas + (p.cajas === 1 ? ' caja' : ' cajas'), 'Con desperdicio necesitás ' + F.fmtNumber(p.m2Necesarios, 2) + ' m²; las cajas cubren ' + F.fmtNumber(p.m2Comprados, 2) + ' m².', 'Para ' + F.fmtNumber(n('superficie'), 2) + ' m² necesito ' + p.cajas + ' cajas de cerámicos (' + F.fmtNumber(p.m2Comprados, 2) + ' m²).');
      } else {
        var l = M.lineales({ metrosLineales: n('lineales'), m2: n('m2'), ancho: n('ancho') });
        var txt = F.fmtNumber(l.metrosLineales, 2) + ' metros lineales × ' + F.fmtNumber(n('ancho'), 2) + ' m de ancho = ' + F.fmtNumber(l.m2, 2) + ' m²';
        mostrar(n('lineales') > 0 ? 'Superficie' : 'Metros lineales', n('lineales') > 0 ? F.fmtNumber(l.m2, 2) + ' m²' : F.fmtNumber(l.metrosLineales, 2) + ' m lineales', txt + '.', txt + '.');
      }
    } catch (e) { $('form-error').textContent = e.message; return; }
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'modo') { toggles(); $('resultado').hidden = true; calculado = false; return; }
    if (calculado) calcular(false);
  });
  toggles();
})();
