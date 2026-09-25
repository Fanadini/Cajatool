(function () {
  'use strict';
  var F = window.CTFormat, D = window.CTDolarTarjeta;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-dolar'), calculado = false;
  function fila(tb, n, v, fuerte) {
    var tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td');
    th.scope = 'row'; th.textContent = n; td.textContent = v; if (fuerte) tr.style.fontWeight = '700';
    tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
  }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { usd: F.parseAR($('usd').value), tipoCambio: F.parseAR($('tc').value), digital: form.querySelector('input[name="tipo"]:checked').value === 'digital',
      iibb: parseFloat($('iibb').value), dolaresPropios: $('propios').checked };
    var r;
    try { r = D.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-total').textContent = F.fmtMoney(r.total);
    var tb = $('res-tabla'); tb.textContent = '';
    fila(tb, 'Precio al dólar oficial', F.fmtMoney(r.base));
    if (p.digital) fila(tb, 'IVA servicios digitales (21 %)', F.fmtMoney(r.iva));
    fila(tb, 'Percepción Ganancias/Bienes Personales (30 %)', p.dolaresPropios ? 'No aplica' : F.fmtMoney(r.percepcion));
    if (p.iibb) fila(tb, 'Percepción IIBB (' + String(p.iibb).replace('.', ',') + ' %)', F.fmtMoney(r.iibb));
    fila(tb, 'Total', F.fmtMoney(r.total), true);
    $('res-nota').textContent = 'Cada dólar te sale ' + F.fmtMoney(r.dolarEfectivo) + ' (' + F.fmtPercent(r.recargoPct, 0) + ' más que el oficial).' +
      (p.dolaresPropios ? '' : ' La percepción del 30 % se puede recuperar como pago a cuenta.');
    $('res-resumen').textContent = 'USD ' + F.fmtNumber(p.usd) + ' con tarjeta = ' + F.fmtMoney(r.total) + ' (dólar oficial ' + F.fmtMoney(p.tipoCambio) +
      ', dólar tarjeta ' + F.fmtMoney(r.dolarEfectivo) + ').';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
