(function () {
  'use strict';
  var F = window.CTFormat, V = window.CTIva;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-iva'), calculado = false;
  function modo() { return form.querySelector('input[name="modo"]:checked').value; }
  function calcular(scroll) {
    $('form-error').textContent = '';
    $('monto-label').textContent = modo() === 'quitar' ? 'Precio final (con IVA)' : 'Precio sin IVA (neto)';
    if (!$('monto').value) return;
    var p = { monto: F.parseAR($('monto').value), alicuota: parseFloat($('alicuota').value), modo: modo() };
    var r;
    try { r = V.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    var a = String(p.alicuota).replace('.', ',') + ' %';
    $('res-label').textContent = p.modo === 'quitar' ? 'Precio sin IVA' : 'Precio con IVA (' + a + ')';
    $('res-main').textContent = F.fmtMoney(p.modo === 'quitar' ? r.neto : r.total);
    $('res-neto').textContent = F.fmtMoney(r.neto);
    $('res-iva').textContent = F.fmtMoney(r.iva);
    $('res-iva-label').textContent = 'IVA ' + a;
    $('res-total').textContent = F.fmtMoney(r.total);
    $('res-resumen').textContent = 'Neto ' + F.fmtMoney(r.neto) + ' + IVA ' + a + ' ' + F.fmtMoney(r.iva) + ' = ' + F.fmtMoney(r.total) + '.';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { calcular(false); });
})();
