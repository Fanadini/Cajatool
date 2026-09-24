/* Cajatools — comportamiento común: inputs de dinero, copiar/compartir, banner de cookies. */
(function () {
  'use strict';
  var F = window.CTFormat;

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { toast('Copiado al portapapeles'); });
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Copiado al portapapeles'); } catch (e) { toast('No se pudo copiar'); }
    ta.remove();
    return Promise.resolve();
  }

  function shareText(title, text) {
    var url = location.href;
    if (navigator.share) {
      return navigator.share({ title: title, text: text, url: url }).catch(function () {});
    }
    return copyText(text + '\n' + url);
  }

  // Inputs con clase "money": formato argentino al salir del campo
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('money') || el.value.trim() === '') return;
    var n = F.parseAR(el.value);
    if (isFinite(n)) el.value = F.fmtNumber(n);
  });

  // Botones [data-copy="#selector"] y [data-share="#selector"]: usan el texto de data-text o del elemento
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy],[data-share]');
    if (!btn) return;
    var sel = btn.getAttribute('data-copy') || btn.getAttribute('data-share');
    var target = document.querySelector(sel);
    if (!target) return;
    var text = target.getAttribute('data-text') || target.innerText.trim();
    if (btn.hasAttribute('data-copy')) copyText(text);
    else shareText(document.title, text);
  });

  // Banner de consentimiento de cookies
  var banner = document.getElementById('cookie-banner');
  var consent;
  try { consent = localStorage.getItem('ct-consent'); } catch (e) { consent = 'unavailable'; }
  if (banner && !consent) {
    banner.hidden = false;
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      try { localStorage.setItem('ct-consent', b.getAttribute('data-consent')); } catch (err) {}
      banner.hidden = true;
    });
  }

  window.CT = { copyText: copyText, shareText: shareText, toast: toast };
})();
