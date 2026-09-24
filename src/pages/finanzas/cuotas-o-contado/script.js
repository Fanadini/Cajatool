(function () {
  'use strict';
  var F = window.CTFormat;
  var C = window.CTCuotas;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-cuotas');
  var calculado = false;
  var REF = { '3': form.getAttribute('data-inflacion3'), '12': form.getAttribute('data-inflacion12'), ultima: form.getAttribute('data-inflacion-ultima') };

  function modo() { return form.querySelector('input[name="modo"]:checked').value; }

  function toggles() {
    $('monto-label').textContent = modo() === 'total' ? 'Precio total en cuotas' : 'Valor de cada cuota';
    $('inflacion').hidden = $('inflacion-ref').value !== 'manual';
  }

  function tasa() {
    var ref = $('inflacion-ref').value;
    return ref === 'manual' ? F.parseAR($('inflacion').value) : parseFloat(REF[ref]);
  }

  function calcular(scroll) {
    $('form-error').textContent = '';
    var n = parseInt($('cuotas').value, 10);
    var monto = F.parseAR($('monto').value);
    var p = {
      contado: F.parseAR($('contado').value),
      cuotas: n,
      valorCuota: modo() === 'total' ? monto / n : monto,
      tasaMensual: tasa(),
      primerMes: $('primera-hoy').checked ? 0 : 1
    };
    var r;
    try { r = C.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }

    var t = F.fmtPercent(p.tasaMensual, 2);
    if (r.conviene === 'cuotas') {
      $('res-main').textContent = 'Conviene pagar en cuotas';
      $('res-explica').textContent = 'Con una inflación del ' + t + ' mensual, las cuotas valen hoy ' + F.fmtMoney(r.valorPresente) +
        ': ' + F.fmtMoney(r.diferencia) + ' menos que el precio de contado (' + F.fmtPercent(r.diferenciaPct, 1) + ').';
    } else if (r.conviene === 'contado') {
      $('res-main').textContent = 'Conviene pagar de contado';
      $('res-explica').textContent = 'Con una inflación del ' + t + ' mensual, las cuotas valen hoy ' + F.fmtMoney(r.valorPresente) +
        ': ' + F.fmtMoney(-r.diferencia) + ' más que el precio de contado (' + F.fmtPercent(-r.diferenciaPct, 1) + ').';
    } else {
      $('res-main').textContent = 'Da prácticamente lo mismo';
      $('res-explica').textContent = 'Con una inflación del ' + t + ' mensual, las cuotas valen hoy ' + F.fmtMoney(r.valorPresente) +
        ', casi igual que el contado. Decidí por comodidad o por otros beneficios.';
    }
    $('res-vp').textContent = F.fmtMoney(r.valorPresente);
    $('res-total').textContent = F.fmtMoney(r.totalCuotas);
    $('res-tem').textContent = F.fmtPercent(r.temImplicita, 2);
    $('res-tea').textContent = F.fmtPercent(r.teaImplicita, 1);

    var tbody = $('res-tabla');
    tbody.textContent = '';
    r.filas.forEach(function (f) {
      var tr = document.createElement('tr');
      [String(f.numero), f.mes === 0 ? 'Hoy' : f.mes === 1 ? '1 mes' : f.mes + ' meses', F.fmtMoney(f.cuota), F.fmtMoney(f.valorHoy)].forEach(function (c, i) {
        var td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    $('res-resumen').textContent = $('res-main').textContent + ': contado ' + F.fmtMoney(p.contado) + ' vs ' + p.cuotas + ' cuotas de ' +
      F.fmtMoney(p.valorCuota) + ' (valen hoy ' + F.fmtMoney(r.valorPresente) + ' con inflación del ' + t + ' mensual; interés implícito ' +
      F.fmtPercent(r.temImplicita, 2) + ' mensual).';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { toggles(); if (calculado) calcular(false); });
  toggles();
})();
