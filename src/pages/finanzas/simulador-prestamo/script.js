(function () {
  'use strict';
  var F = window.CTFormat, P = window.CTPrestamo;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-prestamo'), calculado = false;
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { monto: F.parseAR($('monto').value), cuotas: parseInt($('cuotas').value, 10), tna: F.parseAR($('tna').value),
      sistema: form.querySelector('input[name="sistema"]:checked').value, iva: $('iva').checked };
    var r;
    try { r = P.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    var fija = p.sistema === 'frances';
    $('res-label').textContent = fija ? 'Cuota mensual' + (p.iva ? ' (la primera, con IVA)' : '') : 'Primera cuota (van bajando)';
    $('res-cuota').textContent = F.fmtMoney(r.primeraCuota);
    $('res-total').textContent = F.fmtMoney(r.totalPagado);
    $('res-intereses').textContent = F.fmtMoney(r.totalInteres + r.totalIva);
    $('res-tea').textContent = F.fmtPercent(r.tea, 2);
    $('res-cea').textContent = F.fmtPercent(r.costoEfectivoAnual, 2);
    var tb = $('res-tabla'); tb.textContent = '';
    r.filas.forEach(function (f) {
      var tr = document.createElement('tr');
      [String(f.numero), F.fmtMoney(f.cuota), F.fmtMoney(f.interes + f.iva), F.fmtMoney(f.amortizacion), F.fmtMoney(f.saldo)].forEach(function (c, i) {
        var td = document.createElement(i ? 'td' : 'th'); if (!i) td.scope = 'row'; td.textContent = c; tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    $('res-resumen').textContent = 'Préstamo de ' + F.fmtMoney(p.monto) + ' en ' + p.cuotas + ' cuotas (' + (fija ? 'francés' : 'alemán') + ', TNA ' +
      F.fmtPercent(p.tna, 2) + '): primera cuota ' + F.fmtMoney(r.primeraCuota) + ', total ' + F.fmtMoney(r.totalPagado) + '.';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
