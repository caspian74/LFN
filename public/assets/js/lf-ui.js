/* Utilidades de interfaz compartidas: toast, analítica, captcha, fechas, diálogo. */
(function (g) {
  'use strict';
  var S = g.LF.shared, api = g.LF.api;
  var toastT;

  function toast(msg, kind) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    el.textContent = msg; el.dataset.kind = kind || '';
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 3600);
  }

  /* analítica: solo si los IDs existen y son válidos (los pone el admin en Ajustes) */
  var loaded = {};
  function initAnalytics(seo) {
    try {
      if (seo && /^G-[A-Z0-9]{4,14}$/.test(seo.ga4) && !loaded.ga) {
        loaded.ga = 1; var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + seo.ga4; document.head.appendChild(s);
        g.dataLayer = g.dataLayer || []; g.gtag = function () { g.dataLayer.push(arguments); }; g.gtag('js', new Date()); g.gtag('config', seo.ga4);
      }
      if (seo && /^\d{8,20}$/.test(seo.metaPixel) && !loaded.fb) {
        loaded.fb = 1;
        (function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(g, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        g.fbq('init', seo.metaPixel); g.fbq('track', 'PageView');
      }
    } catch (e) { /* bloqueadores de anuncios */ }
  }
  function track(name, params) {
    try {
      params = params || {};
      if (g.gtag) g.gtag('event', name, params);
      if (g.fbq) { if (name === 'form_submitted') g.fbq('track', 'Lead'); else if (name === 'checkout_started') g.fbq('track', 'InitiateCheckout'); else g.fbq('trackCustom', name, params); }
    } catch (e) { /* noop */ }
  }

  /* Cloudflare Turnstile (opcional) */
  var tsLoad;
  function captcha(form) {
    var key = api.health() && api.health().turnstile;
    if (!key) return function () { return ''; };
    var slot = form.querySelector('.cf-slot');
    if (!slot) { slot = document.createElement('div'); slot.className = 'cf-slot'; var btn = form.querySelector('[type=submit]'); btn.parentNode.insertBefore(slot, btn); }
    var wid = null;
    tsLoad = tsLoad || new Promise(function (ok) { var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = ok; document.head.appendChild(s); });
    tsLoad.then(function () { if (g.turnstile) wid = g.turnstile.render(slot, { sitekey: key, theme: 'light' }); });
    return function () { return g.turnstile && wid !== null ? g.turnstile.getResponse(wid) : ''; };
  }
  function captchaReset(form) { try { if (g.turnstile) g.turnstile.reset(); } catch (e) { /* noop */ } }

  function utm() {
    var o = {}; try { o = JSON.parse(sessionStorage.getItem('lf_utm') || '{}'); o.landing = sessionStorage.getItem('lf_landing') || ''; } catch (e) { /* noop */ }
    return o;
  }

  function fmtDate(iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return String(iso).slice(0, 10);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Tijuana' }) + (withTime ? ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Tijuana' }) : '');
  }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s)) return '';
    if (s < 60) return 'ahora'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h'; return Math.floor(s / 86400) + ' d';
  }

  function demoBanner() {
    if (api.mode() !== 'demo' || document.getElementById('demo-banner')) return;
    var b = document.createElement('div'); b.id = 'demo-banner'; b.className = 'demo-banner';
    b.innerHTML = '<b>Modo demo.</b> Sin servidor conectado: los datos se guardan solo en este navegador. En Cloudflare funciona con base de datos real.';
    document.body.insertBefore(b, document.body.firstChild);
  }

  function applyTheme(css) {
    var st = document.getElementById('lf-theme');
    if (!st) { st = document.createElement('style'); st.id = 'lf-theme'; document.head.appendChild(st); }
    st.textContent = css;
  }

  /* confirmación con <dialog> */
  function confirmBox(title, text, okText, danger) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = '<div class="modal-in"><h3></h3><p class="muted"></p><div class="row-btns"><button class="btn btn-ghost btn-sm" data-r="0" type="button"><span>Cancelar</span></button><button class="btn btn-sm ' + (danger ? 'danger' : 'btn-primary') + '" data-r="1" type="button"><span></span></button></div></div>';
      d.querySelector('h3').textContent = title; d.querySelector('p').textContent = text || ''; d.querySelector('[data-r="1"] span').textContent = okText || 'Aceptar';
      document.body.appendChild(d);
      function end(v) { d.close(); setTimeout(function () { d.remove(); }, 300); resolve(v); }
      d.addEventListener('click', function (e) { var r = e.target.closest && e.target.closest('[data-r]'); if (r) end(r.dataset.r === '1'); });
      d.addEventListener('cancel', function (e) { e.preventDefault(); end(false); });
      d.showModal();
    });
  }

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

  g.LF.ui = { toast: toast, track: track, initAnalytics: initAnalytics, captcha: captcha, captchaReset: captchaReset, utm: utm, fmtDate: fmtDate, ago: ago, demoBanner: demoBanner, applyTheme: applyTheme, confirm: confirmBox, debounce: debounce };
})(window);
