(function () {
  'use strict';
  var F = window.CTFormat;
  var P = window.CTPlazoFijo;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-pf');
  var calculado = false;

  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = {
      capital: F.parseAR($('capital').value),
      dias: parseInt($('dias').value, 10),
      tna: F.parseAR($('tna').value),
      inflacionMensual: F.parseAR($('inflacion').value) || 0,
      renovar: $('renovar').checked,
      meses: 12
    };
    var r;
    try { r = P.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-label').textContent = p.renovar ? 'Vas a tener después de 12 meses renovando' : 'Vas a cobrar a los ' + p.dias + ' días';
    $('res-monto').textContent = F.fmtMoney(r.montoFinal);
    $('res-explica').textContent = (r.leGana ? 'Le gana a la inflación: ' : 'No le gana a la inflación: ') +
      'rendís un ' + F.fmtPercent(r.rendimiento, 2) + ' contra una inflación estimada del ' + F.fmtPercent(r.inflacionPeriodo, 2) + ' en el período.';
    $('res-interes').textContent = F.fmtMoney(r.interes);
    $('res-tea').textContent = F.fmtPercent(r.tea, 2);
    $('res-real').textContent = (r.rendimientoReal > 0 ? '+' : '') + F.fmtPercent(r.rendimientoReal, 2);
    $('res-hoy').textContent = F.fmtMoney(r.montoEnPesosDeHoy);
    $('res-resumen').textContent = 'Plazo fijo de ' + F.fmtMoney(p.capital) + ' a ' + (p.renovar ? '12 meses renovando cada ' + p.dias + ' días' : p.dias + ' días') +
      ' con TNA ' + F.fmtPercent(p.tna, 2) + ': ' + F.fmtMoney(r.montoFinal) + ' (intereses ' + F.fmtMoney(r.interes) + ', rendimiento real ' + F.fmtPercent(r.rendimientoReal, 2) + ').';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
