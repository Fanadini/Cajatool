(function () {
  'use strict';
  var F = window.CTFormat, H = window.CTHorasExtra;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-he'), calculado = false;
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { sueldo: F.parseAR($('sueldo').value), divisor: parseFloat($('divisor').value), horas50: F.parseAR($('h50').value) || 0, horas100: F.parseAR($('h100').value) || 0 };
    var r;
    try { r = H.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-total').textContent = F.fmtMoney(r.total);
    $('res-hora').textContent = F.fmtMoney(r.valorHora);
    $('res-50').textContent = F.fmtMoney(r.pago50);
    $('res-50-l').textContent = F.fmtNumber(p.horas50, 0) + ' h al 50 % (' + F.fmtMoney(r.valorHora50) + ' c/u)';
    $('res-100').textContent = F.fmtMoney(r.pago100);
    $('res-100-l').textContent = F.fmtNumber(p.horas100, 0) + ' h al 100 % (' + F.fmtMoney(r.valorHora100) + ' c/u)';
    $('res-resumen').textContent = 'Horas extra: ' + F.fmtMoney(r.total) + ' brutos (' + p.horas50 + ' h al 50 % y ' + p.horas100 + ' h al 100 %, hora común ' + F.fmtMoney(r.valorHora) + ').';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
