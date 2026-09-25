(function () {
  'use strict';
  var F = window.CTFormat, I = window.CTImc;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-imc'), calculado = false;
  function calcular(scroll) {
    $('form-error').textContent = '';
    var r;
    try { r = I.calcular(F.parseAR($('peso').value), F.parseAR($('altura').value)); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-main').textContent = F.fmtNumber(r.imc, 1) + ' · ' + r.categoria;
    $('res-explica').textContent = 'Para tu altura, el peso saludable va de ' + F.fmtNumber(r.pesoMin, 1) + ' a ' + F.fmtNumber(r.pesoMax, 1) + ' kg (IMC entre 18,5 y 24,9).';
    var activo = Math.min(r.indice, 3);
    Array.prototype.forEach.call(document.querySelectorAll('.imc-scale li'), function (li) {
      var on = +li.getAttribute('data-i') === activo; li.classList.toggle('on', on);
      if (on) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
    });
    $('res-resumen').textContent = 'Mi IMC es ' + F.fmtNumber(r.imc, 1) + ' (' + r.categoria + ', según la OMS).';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
