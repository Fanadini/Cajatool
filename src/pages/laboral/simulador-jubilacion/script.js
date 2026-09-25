(function () {
  'use strict';
  var F = window.CTFormat, J = window.CTJubilacion;
  var A = JSON.parse(document.getElementById('data-anses').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-jub'), calculado = false;
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fecha(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { nacimiento: $('nacimiento').value, sexo: $('sexo').value, aniosAportes: F.parseAR($('aportes').value), sigueAportando: $('sigue').checked, sueldo: F.parseAR($('sueldo').value), hoy: hoy() };
    var r;
    try { r = J.calcular(p, A); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-fecha').textContent = r.edadJubilatoria + ' años' + (r.aniosFaltantes ? ' (' + fecha(r.fechaEdad) + ')' : '');
    $('res-aportes').textContent = r.aportesAlJubilarse + ' años';
    var edadTxt = r.aniosFaltantes ? 'Llegás a la edad jubilatoria el ' + fecha(r.fechaEdad) + ', dentro de ' + r.aniosFaltantes + (r.aniosFaltantes === 1 ? ' año' : ' años') + '. ' : 'Ya tenés la edad jubilatoria. ';
    if (r.cumple) {
      $('res-label').textContent = 'Haber jubilatorio estimado';
      $('res-main').textContent = F.fmtMoney(r.haber);
      $('res-explica').textContent = edadTxt + 'PBU ' + F.fmtMoney(r.pbu) + ' + PC y PAP ' + F.fmtMoney(r.pcPap) + (r.ajuste === 'minimo' ? '. Se eleva al haber mínimo.' : r.ajuste === 'maximo' ? '. Se limita al haber máximo.' : '.');
      $('res-tasa').textContent = r.tasaReemplazo != null ? F.fmtPercent(r.tasaReemplazo, 0) + ' del sueldo' : '—';
      $('res-resumen').textContent = 'Jubilación estimada: ' + F.fmtMoney(r.haber) + ' por mes a los ' + r.edadJubilatoria + ' años con ' + r.aportesAlJubilarse + ' años de aportes (montos ANSES vigentes).';
    } else {
      $('res-label').textContent = 'Te faltan aportes';
      $('res-main').textContent = r.aportesFaltantes + (r.aportesFaltantes === 1 ? ' año' : ' años');
      $('res-explica').textContent = edadTxt + 'Con ' + r.aportesAlJubilarse + ' años de aportes no llegás a los 30 que exige la jubilación ordinaria. Desde los 65 podrías pedir la PUAM: ' + F.fmtMoney(r.puam) + ' por mes.';
      $('res-tasa').textContent = '—';
      $('res-resumen').textContent = 'Me faltarían ' + r.aportesFaltantes + ' años de aportes para jubilarme. PUAM: ' + F.fmtMoney(r.puam) + ' por mes.';
    }
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
