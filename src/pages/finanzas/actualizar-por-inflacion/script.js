(function () {
  'use strict';
  var F = window.CTFormat, C = window.CTInflacion;
  var niveles = JSON.parse(document.getElementById('data-indices').textContent).ipc.niveles;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-inf'), calculado = false;
  var max = form.getAttribute('data-max');
  $('desde').value = (+max.slice(0, 4) - 1) + max.slice(4);
  function mes(ym) { return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ym + '-15T12:00:00Z')); }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { monto: F.parseAR($('monto').value), desde: $('desde').value, hasta: $('hasta').value };
    var r;
    try { r = C.actualizar(p, niveles); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-label').textContent = F.fmtMoney(p.monto) + ' de ' + mes(p.desde) + ' equivalen a';
    $('res-main').textContent = F.fmtMoney(r.montoActualizado);
    $('res-acum').textContent = (r.inflacionAcumulada > 0 ? '+' : '') + F.fmtPercent(r.inflacionAcumulada, 1);
    $('res-prom').textContent = F.fmtPercent(r.promedioMensual, 2);
    $('res-meses').textContent = String(Math.abs(r.meses));
    $('res-resumen').textContent = F.fmtMoney(p.monto) + ' de ' + mes(p.desde) + ' = ' + F.fmtMoney(r.montoActualizado) + ' de ' + mes(p.hasta) + ' (inflación ' + F.fmtPercent(r.inflacionAcumulada, 1) + ', IPC INDEC).';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
