(function () {
  'use strict';
  var F = window.CTFormat, U = window.CTUva;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-uva'), calculado = false;
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { capital: F.parseAR($('capital').value), dias: parseInt($('dias').value, 10), tna: F.parseAR($('tna').value), inflacionMensual: F.parseAR($('inflacion').value), tasaUva: F.parseAR($('tasa').value) || 0 };
    var r;
    try { r = U.comparar(p); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-main').textContent = r.conviene === 'uva' ? 'Plazo fijo UVA' : r.conviene === 'tradicional' ? 'Plazo fijo tradicional' : 'Da prácticamente lo mismo';
    var dif = Math.abs(r.uva - r.tradicional);
    $('res-explica').textContent = r.conviene === 'igual' ? 'Con esa inflación los dos rinden casi igual.' : 'Rinde ' + F.fmtMoney(dif) + ' más en ' + p.dias + ' días con una inflación del ' + F.fmtPercent(p.inflacionMensual, 2) + ' mensual.';
    $('res-tr').textContent = F.fmtMoney(r.tradicional); $('res-uva').textContent = F.fmtMoney(r.uva); $('res-eq').textContent = F.fmtPercent(r.inflacionEquilibrio, 2) + ' mensual';
    $('res-resumen').textContent = F.fmtMoney(p.capital) + ' a ' + p.dias + ' días: tradicional ' + F.fmtMoney(r.tradicional) + ', UVA ' + F.fmtMoney(r.uva) + ' (inflación de equilibrio ' + F.fmtPercent(r.inflacionEquilibrio, 2) + ' mensual).';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
