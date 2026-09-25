(function () {
  'use strict';
  var F = window.CTFormat;
  var S = window.CTSueldo;
  var data = JSON.parse(document.getElementById('data-ganancias').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-sueldo');
  var calculado = false;

  function mesActual() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function fila(tbody, nombre, monto, detalle, fuerte) {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.scope = 'row';
    th.textContent = nombre;
    if (detalle) { var s = document.createElement('small'); s.className = 'detalle'; s.textContent = detalle; th.appendChild(s); }
    var td = document.createElement('td');
    td.textContent = monto;
    if (fuerte) tr.style.fontWeight = '700';
    tr.appendChild(th); tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = {
      bruto: F.parseAR($('bruto').value),
      mes: mesActual(),
      conyuge: $('conyuge').checked,
      hijos: parseInt($('hijos').value, 10),
      otrasDeducciones: F.parseAR($('otras').value) || 0
    };
    var r;
    try { r = S.calcular(p, data); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-neto').textContent = F.fmtMoney(r.neto);
    var tb = $('res-tabla');
    tb.textContent = '';
    var baseTxt = r.topeAplicado ? 'sobre el tope de ' + F.fmtMoney(r.tope.monto) : '';
    fila(tb, 'Sueldo bruto', F.fmtMoney(p.bruto));
    fila(tb, 'Jubilación (11 %)', '− ' + F.fmtMoney(r.aportes.jubilacion), baseTxt);
    fila(tb, 'PAMI (3 %)', '− ' + F.fmtMoney(r.aportes.pami), baseTxt);
    fila(tb, 'Obra social (3 %)', '− ' + F.fmtMoney(r.aportes.obraSocial), baseTxt);
    fila(tb, 'Ganancias (estimado)', r.retencion ? '− ' + F.fmtMoney(r.retencion) : F.fmtMoney(0),
      r.retencion ? 'alícuota marginal ' + r.alicuotaMarginal + ' %' : 'no llegás al mínimo');
    fila(tb, 'Sueldo neto', F.fmtMoney(r.neto), 'descuento total ' + F.fmtPercent(r.descuentoTotalPct, 1), true);
    $('res-nota').textContent = 'Con estos datos, la retención de Ganancias empieza con un sueldo bruto de ' + F.fmtMoney(r.umbral) +
      '. Valores de ARCA del ' + data.vigencia.toLowerCase() + '.';
    $('res-resumen').textContent = 'Sueldo bruto ' + F.fmtMoney(p.bruto) + ' → neto ' + F.fmtMoney(r.neto) + ' (aportes ' + F.fmtMoney(r.totalAportes) +
      ', Ganancias ' + F.fmtMoney(r.retencion) + ').';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
