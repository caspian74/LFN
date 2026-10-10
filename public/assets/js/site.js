/* Landing: interacciones, calculadora, formulario, compra y actualización desde el panel admin. */
(function (g) {
  'use strict';
  var S = g.LF.shared, R = g.LF.render, api = g.LF.api, ui = g.LF.ui;
  var content = null, io = null, bound = false;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function reveal() {
    var els = $$('[data-reveal]:not(.in)');
    if (!('IntersectionObserver' in g)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (list) { list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  function initCalc() {
    var box = $('.calc'); if (!box) return;
    var ids = ['c-fee', 'c-ads', 'c-cpl', 'c-close', 'c-ticket'];
    function v(id) { var n = parseFloat($('#' + id).value); return isFinite(n) && n >= 0 ? n : 0; }
    function run() {
      var fee = v('c-fee'), ads = v('c-ads'), cpl = Math.max(v('c-cpl'), 1), close = Math.min(v('c-close'), 100), ticket = v('c-ticket');
      var leads = ads / cpl, sales = leads * close / 100, rev = sales * ticket, invest = fee + ads, be = ticket ? invest / ticket : 0;
      $('#o-leads').textContent = S.num(leads); $('#o-sales').textContent = (Math.round(sales * 10) / 10).toString();
      $('#o-rev').textContent = S.money(rev); $('#o-be').textContent = ticket ? (Math.ceil(be * 10) / 10).toString() + ' ventas' : '—';
      var msg = !ticket ? 'Escribe tu venta promedio para calcular.' : rev >= invest
        ? 'Con estos números, tus ventas estimadas cubren los ' + S.money(invest) + ' de inversión mensual (honorarios más anuncios).'
        : 'Con estos números te faltarían ' + S.num(Math.ceil(Math.max(be - sales, 0))) + ' ventas al mes para cubrir ' + S.money(invest) + '. Platiquemos cómo mejorar el costo por mensaje o el cierre.';
      $('#o-msg').textContent = msg;
    }
    ids.forEach(function (id) { $('#' + id).addEventListener('input', run); }); run();
  }

  function fieldErr(el, bad) { el.setAttribute('aria-invalid', bad ? 'true' : 'false'); }

  function initForm() {
    var form = $('#lead-form'); if (!form) return;
    var msg = $('#lead-msg'), btn = form.querySelector('[type=submit]'), token = ui.captcha(form), started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; ui.track('form_started', { form: 'diagnostico' }); } });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); msg.className = 'form-msg'; msg.textContent = '';
      var f = new FormData(form), data = { name: f.get('name'), business: f.get('business'), whatsapp: f.get('whatsapp'), niche: f.get('niche'), message: f.get('message'), website: f.get('website'), consent: form.consent.checked, utm: ui.utm(), turnstile: token() };
      var bad = false;
      ['name', 'business', 'whatsapp'].forEach(function (k) { var el = form.elements[k], invalid = !String(data[k] || '').trim() || (k === 'whatsapp' && !S.normalizeWhatsApp(data[k])); fieldErr(el, invalid); bad = bad || invalid; });
      if (bad) { msg.className = 'form-msg err'; msg.textContent = 'Revisa los campos marcados. El WhatsApp debe tener 10 dígitos.'; var first = form.querySelector('[aria-invalid=true]'); if (first) first.focus(); return; }
      if (!data.consent) { msg.className = 'form-msg err'; msg.textContent = 'Marca la casilla para poder contactarte.'; return; }
      btn.disabled = true; btn.querySelector('span').textContent = 'Enviando…';
      api.post('/lead', data).then(function (r) {
        btn.disabled = false; btn.querySelector('span').textContent = content.contact.button;
        if (r.ok) {
          msg.className = 'form-msg ok'; msg.textContent = content.contact.success;
          ui.track('form_submitted', { form: 'diagnostico', giro: data.niche || '' });
          form.reset(); ui.captchaReset(form);
          var a = document.createElement('a'); a.className = 'mini-link'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Si prefieres, escríbenos ya por WhatsApp';
          a.href = S.waLink(content.brand.whatsapp, 'Hola, soy ' + data.name + ' de ' + data.business + '. Acabo de pedir mi diagnóstico.'); msg.appendChild(document.createElement('br')); msg.appendChild(a);
        } else if (r.status === 0) {
          msg.className = 'form-msg err'; msg.textContent = 'No hubo conexión. Escríbenos directo por WhatsApp para no perder tu lugar.';
        } else { msg.className = 'form-msg err'; msg.textContent = api.errText(r); ui.captchaReset(form); }
      });
    });
  }

  function openBuyModal(r, pkgName) {
    var d = $('#buy-modal'); if (!d) return;
    $('#buy-title', d).textContent = 'Recibimos tu pedido de ' + pkgName;
    $('#buy-text', d).textContent = 'Pedido #' + r.orderId + '. Escríbenos por WhatsApp para confirmar el pago (tarjeta o transferencia). En cuanto se confirme, activamos tu cuenta con panel completo.';
    $('#buy-wa', d).href = r.whatsapp;
    d.showModal();
  }

  function buy(pkgId, btn) {
    var pkg = content.packages.items.filter(function (p) { return p.id === pkgId; })[0]; if (!pkg) return;
    ui.track('cta_clicked', { where: 'comprar_' + pkgId });
    btn.disabled = true;
    api.get('/me').then(function (m) {
      if (!m.data || !m.data.user) { location.href = '/auth.html?mode=register&next=' + encodeURIComponent('/?buy=' + pkgId); return; }
      return api.post('/checkout', { packageId: pkgId }).then(function (r) {
        if (!r.ok) { ui.toast(api.errText(r)); return; }
        ui.track('checkout_started', { package: pkgId, value: pkg.price, currency: 'MXN' });
        if (r.data.url) { location.href = r.data.url; return; }
        openBuyModal(r.data, pkg.name);
      });
    }).then(function () { btn.disabled = false; }, function () { btn.disabled = false; });
  }

  function bind() {
    var top = $('#top'), burger = $('#burger'), nav = $('#nav');
    if (burger) {
      function close() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú'); document.body.style.overflow = ''; }
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); document.body.style.overflow = open ? 'hidden' : '';
      });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    $$('[data-buy]').forEach(function (b) { b.addEventListener('click', function () { buy(b.dataset.buy, b); }); });
    $$('[data-track]').forEach(function (a) { a.addEventListener('click', function () { ui.track(a.dataset.track, { where: a.dataset.where || '' }); }); });
    var d = $('#buy-modal'); if (d) { d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('.modal-x')) d.close(); }); }
    initCalc(); initForm(); reveal();
    var onScroll = function () { if (top) top.classList.toggle('stuck', g.scrollY > 8); };
    if (!bound) { g.addEventListener('scroll', onScroll, { passive: true }); bound = true; } onScroll();
  }

  function render(c) {
    content = c;
    ui.applyTheme(R.themeCss(c));
    $('#app').innerHTML = R.renderBody(c);
    document.title = c.seo.title;
    var md = $('meta[name=description]'); if (md) md.setAttribute('content', c.seo.description);
    bind();
  }

  function init() {
    var app = $('#app'); if (!app) return;
    var baked = $('meta[name=lf-hash]');
    content = S.resolveContent(g.__LF_CONTENT || {});
    bind();
    api.ready().then(function () {
      ui.demoBanner();
      return api.get('/content');
    }).then(function (r) {
      if (r && r.data && r.data.content) {
        var c = S.resolveContent(r.data.content);
        ui.initAnalytics(c.seo);
        if (!baked || baked.content !== S.contentHash(c)) render(c); else content = c;
      }
      var q = new URLSearchParams(location.search).get('buy');
      if (q) { history.replaceState(null, '', '/'); var b = $('[data-buy="' + q.replace(/[^a-z0-9_-]/gi, '') + '"]'); if (b) { b.scrollIntoView({ block: 'center' }); buy(q, b); } }
    });
    // la ficha de contenido se refresca cada vez que vuelves a la pestaña
    document.addEventListener('visibilitychange', function () { if (!document.hidden && api.mode() === 'live') api.get('/content').then(function (r) { if (r.data && r.data.hash && r.data.content && r.data.hash !== S.contentHash(content)) render(S.resolveContent(r.data.content)); }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
