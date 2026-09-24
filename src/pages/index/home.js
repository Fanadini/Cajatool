(function () {
  'use strict';
  var input = document.getElementById('buscador');
  var empty = document.getElementById('sin-resultados');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.category .card'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.category'));
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  input.addEventListener('input', function () {
    var q = norm(input.value.trim());
    var visible = 0;
    cards.forEach(function (c) {
      var show = !q || norm(c.getAttribute('data-search')).indexOf(q) !== -1;
      c.hidden = !show;
      if (show) visible++;
    });
    sections.forEach(function (s) { s.hidden = !s.querySelector('.card:not([hidden])'); });
    empty.hidden = visible > 0;
  });
})();
