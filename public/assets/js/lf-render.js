/* Línea Frontera · render puro de la landing (HTML como string). Se usa en bake (Node) y en el navegador. */
(function (g) {
  'use strict';
  var S = g.LF && g.LF.shared ? g.LF.shared : (typeof require !== 'undefined' ? require('./lf-shared.js') : null);
  var e = S.esc;

  var ICONS = {
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z"/><path d="M8.5 11h7M8.5 14h4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    window: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wa: '<path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12Z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 8.5Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7 6.6 19.6l1.1-6L3.2 9.4l6.1-.8L12 3Z"/>'
  };
  function icon(n, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || ICONS.star) + '</svg>';
  }

  function hl(s) { return e(s).replace(/\|\|(.+?)\|\|/g, '<em class="hl">$1</em>'); }
  function rv(i) { return ' data-reveal style="--i:' + i + '"'; }
  function head(kicker, title, sub, center) {
    return '<header class="sec-head' + (center ? ' center' : '') + '"' + rv(0) + '>' + (kicker ? '<span class="kicker">' + e(kicker) + '</span>' : '') +
      '<h2>' + hl(title) + '</h2>' + (sub ? '<p class="lead">' + e(sub) + '</p>' : '') + '</header>';
  }

  /* ---------- gráfica de ejemplo (SVG sin JS) ---------- */
  function areaChart(values, w, h) {
    var max = Math.max.apply(null, values) || 1, n = values.length, pad = 6;
    var pts = values.map(function (v, i) { return [pad + i * (w - pad * 2) / (n - 1), h - pad - (v / max) * (h - pad * 2)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[n - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pts[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="chart" role="img" aria-label="Gráfica de ejemplo de leads por día" preserveAspectRatio="none">' +
      '<defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent2)" stop-opacity=".38"/><stop offset="1" stop-color="var(--accent2)" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#ga)"/><path class="chart-line" pathLength="1" d="' + line + '" fill="none" stroke="var(--accent2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ---------- secciones ---------- */
  var R = {};

  R.problem = function (c) {
    var p = c.problem;
    return '<section class="sec" id="problema" aria-labelledby="h-problema">' + head('Te entendemos', p.title).replace('<h2>', '<h2 id="h-problema">') +
      '<div class="grid g3">' + p.items.map(function (it, i) {
        return '<article class="card pain"' + rv(i + 1) + '><span class="num">0' + (i + 1) + '</span><h3>' + e(it.t) + '</h3><p>' + e(it.d) + '</p></article>';
      }).join('') + '</div></section>';
  };

  R.services = function (c) {
    var s = c.services;
    return '<section class="sec tint" id="servicios"><div class="wrap">' + head('Servicios', s.title, s.sub) +
      '<div class="grid g3">' + s.items.map(function (it, i) {
        return '<article class="card svc"' + rv(i + 1) + '><span class="svc-ic">' + icon(it.icon) + '</span><h3>' + e(it.t) + '</h3><p>' + e(it.d) + '</p></article>';
      }).join('') + '</div></div></section>';
  };

  R.process = function (c) {
    var p = c.process;
    return '<section class="sec" id="proceso">' + head('Proceso', p.title) +
      '<ol class="steps">' + p.steps.map(function (st, i) {
        return '<li class="step"' + rv(i + 1) + '><span class="step-n">' + (i + 1) + '</span><div><h3>' + e(st.t) + '</h3><p>' + e(st.d) + '</p></div></li>';
      }).join('') + '</ol></section>';
  };

  R.demo = function (c) {
    var d = c.demo, ex = S.exampleClientData(), t = S.totals(ex);
    var leads = ex.series.map(function (r) { return r.leads; });
    var kp = [
      ['Leads del mes', S.num(t.leads), 'var(--accent)'],
      ['Costo por lead', S.money(t.cpl), 'var(--accent2)'],
      ['Ventas cerradas', S.num(t.sales), 'var(--accent3)'],
      ['Retorno', t.roas.toFixed(1) + 'x', 'var(--sun)']
    ];
    return '<section class="sec dark" id="panel"><div class="wrap">' + head('Panel del cliente', d.title, d.sub) +
      '<div class="mock"' + rv(1) + '><div class="mock-bar"><i></i><i></i><i></i><span>lineafrontera.stream/cuenta</span><b class="tag-ex">Ejemplo</b></div>' +
      '<div class="mock-body"><div class="kpis">' + kp.map(function (k) {
        return '<div class="kpi" style="--k:' + k[2] + '"><span>' + e(k[0]) + '</span><strong data-count="' + e(k[1]) + '">' + e(k[1]) + '</strong></div>';
      }).join('') + '</div>' +
      '<div class="mock-grid"><div class="mock-chart"><h4>Leads por día</h4>' + areaChart(leads, 520, 150) + '</div>' +
      '<div class="mock-list"><h4>Campañas</h4>' + ex.campaigns.map(function (cp) {
        return '<div class="row"><span class="dot ' + (cp.status === 'activa' ? 'on' : '') + '"></span><span class="grow">' + e(cp.name) + '</span><b>' + S.num(cp.leads) + ' leads</b></div>';
      }).join('') + '<h4>Posiciones en Google</h4>' + ex.seo.rankings.map(function (r) {
        return '<div class="row"><span class="grow">' + e(r.kw) + '</span><b>#' + r.pos + '</b></div>';
      }).join('') + '</div></div></div></div></div></section>';
  };

  R.packages = function (c) {
    var p = c.packages;
    return '<section class="sec" id="paquetes">' + head('Paquetes', p.title, p.sub, true) +
      '<div class="grid g3 pkgs">' + p.items.map(function (pk, i) {
        return '<article class="card pkg' + (pk.featured ? ' featured' : '') + '"' + rv(i + 1) + ' data-pkg-card="' + e(pk.id) + '">' +
          (pk.featured ? '<span class="hanko" aria-hidden="true">推し</span>' : '') +
          (pk.badge ? '<span class="badge">' + e(pk.badge) + '</span>' : '') +
          '<h3>' + e(pk.name) + '</h3><p class="tagline">' + e(pk.tagline) + '</p>' +
          '<p class="price"><span class="amt">' + S.money(pk.price) + '</span><span class="per"> MXN / mes</span></p>' +
          '<ul class="ticks">' + pk.features.map(function (f) { return '<li>' + icon('check') + '<span>' + e(f) + '</span></li>'; }).join('') + '</ul>' +
          '<button class="btn ' + (pk.featured ? 'btn-primary' : 'btn-ghost') + ' block" type="button" data-buy="' + e(pk.id) + '"><span>Contratar ' + e(pk.name) + '</span>' + icon('arrow') + '</button>' +
          '<a class="mini-link" href="' + e(S.waLink(c.brand.whatsapp, 'Hola, me interesa el paquete ' + pk.name + ' de Línea Frontera.')) + '" target="_blank" rel="noopener" data-track="cta_clicked" data-where="paquete_' + e(pk.id) + '">Prefiero hablarlo primero</a>' +
          '</article>';
      }).join('') + '</div>' +
      (p.addons.length ? '<div class="addons"' + rv(4) + '><strong>Extras</strong>' + p.addons.map(function (a) { return '<span class="chip">' + e(a.name) + ' · ' + e(a.price) + '</span>'; }).join('') + '</div>' : '') +
      (p.note ? '<p class="fine center"' + rv(5) + '>' + e(p.note) + '</p>' : '') + '</section>';
  };

  R.calculator = function (c) {
    var k = c.calculator, def = c.packages.items.filter(function (p) { return p.featured; })[0] || c.packages.items[0] || { price: 9900 };
    function f(id, label, val, step, suffix) {
      return '<label class="fld"><span>' + label + '</span><div class="num-in"><input id="' + id + '" type="number" inputmode="decimal" min="0" step="' + step + '" value="' + val + '">' + (suffix ? '<i>' + suffix + '</i>' : '') + '</div></label>';
    }
    return '<section class="sec tint" id="calculadora"><div class="wrap">' + head('Calculadora', k.title, k.sub) +
      '<div class="calc"' + rv(1) + ' data-fee="' + (def.price || 0) + '"><div class="calc-in">' +
      f('c-fee', 'Honorarios mensuales (MXN)', def.price || 9900, 100, '') + f('c-ads', 'Inversión en anuncios (MXN)', 4000, 100, '') +
      f('c-cpl', 'Costo por mensaje o lead (MXN)', 60, 5, '') + f('c-close', 'De cada 100 mensajes, ¿cuántos compran?', 20, 1, '%') + f('c-ticket', 'Venta promedio por cliente (MXN)', 1500, 50, '') +
      '</div><div class="calc-out" aria-live="polite"><div><span>Mensajes al mes</span><strong id="o-leads">0</strong></div><div><span>Ventas al mes</span><strong id="o-sales">0</strong></div>' +
      '<div><span>Ingresos estimados</span><strong id="o-rev">$0</strong></div><div class="hero-o"><span>Ventas para recuperar tu inversión</span><strong id="o-be">0</strong></div>' +
      '<p class="fine" id="o-msg"></p><a class="btn btn-primary" href="#contacto" data-track="cta_clicked" data-where="calculadora"><span>Quiero revisar mis números</span>' + icon('arrow') + '</a></div></div></div></section>';
  };

  R.audience = function (c) {
    var a = c.audience;
    return '<section class="sec" id="giros">' + head('Para quién', a.title, a.sub, true) +
      '<div class="chips"' + rv(1) + '>' + a.chips.map(function (x, i) { return '<span class="chip lg" style="--i:' + i + '">' + e(x) + '</span>'; }).join('') + '</div></section>';
  };

  R.proof = function (c) {
    var p = c.proof, tm = p.testimonials.filter(function (t) { return t.text; });
    return '<section class="sec tint" id="compromisos"><div class="wrap">' + head('Confianza', p.title) +
      '<div class="grid g2">' + p.commitments.map(function (it, i) {
        return '<article class="card commit"' + rv(i + 1) + '><span class="seal">' + icon('check') + '</span><div><h3>' + e(it.t) + '</h3><p>' + e(it.d) + '</p></div></article>';
      }).join('') + '</div>' +
      (tm.length ? '<div class="grid g3 tms">' + tm.map(function (t, i) {
        return '<figure class="card tm"' + rv(i + 1) + '><blockquote>' + e(t.text) + '</blockquote><figcaption><b>' + e(t.name) + '</b> ' + e(t.role) + '</figcaption></figure>';
      }).join('') + '</div>' : '') + '</div></section>';
  };

  R.faq = function (c) {
    return '<section class="sec" id="faq">' + head('Preguntas frecuentes', 'Lo que casi todos preguntan', '', true) +
      '<div class="faq"' + rv(1) + '>' + c.faq.map(function (q, i) {
        return '<details' + (i === 0 ? ' open' : '') + '><summary><span>' + e(q.q) + '</span>' + icon('plus', 'pl') + '</summary><div class="ans"><div><p>' + e(q.a) + '</p></div></div></details>';
      }).join('') + '</div></section>';
  };

  R.contact = function (c) {
    var k = c.contact, b = c.brand;
    return '<section class="sec contact" id="contacto"><div class="contact-card"' + rv(0) + '><div class="contact-copy"><span class="kicker light">Contacto</span><h2>' + hl(k.title) + '</h2><p class="lead">' + e(k.sub) + '</p>' +
      '<ul class="ticks light"><li>' + icon('check') + '<span>Respuesta el mismo día hábil</span></li><li>' + icon('check') + '<span>Sin compromiso</span></li><li>' + icon('check') + '<span>Ideas concretas para tu negocio</span></li></ul>' +
      '<a class="mini-link light" href="' + e(S.waLink(b.whatsapp, 'Hola, quiero un diagnóstico para mi negocio.')) + '" target="_blank" rel="noopener" data-track="cta_clicked" data-where="contacto_wa">O escríbenos directo por WhatsApp</a></div>' +
      '<form class="form" id="lead-form" novalidate autocomplete="on"><div class="hp" aria-hidden="true"><label>Sitio web<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="fld"><span>Tu nombre</span><input name="name" required maxlength="80" autocomplete="name" placeholder="Ana Pérez"></label>' +
      '<label class="fld"><span>Nombre de tu negocio</span><input name="business" required maxlength="100" autocomplete="organization" placeholder="Clínica Sol"></label>' +
      '<label class="fld"><span>Tu WhatsApp</span><input name="whatsapp" required type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="664 123 4567"></label>' +
      '<label class="fld"><span>Giro <em>(opcional)</em></span><input name="niche" maxlength="80" placeholder="Dentista, restaurante, gimnasio…"></label>' +
      '<label class="fld"><span>¿Qué quieres lograr? <em>(opcional)</em></span><textarea name="message" rows="3" maxlength="600" placeholder="Más citas, más pedidos, aparecer en Google…"></textarea></label>' +
      '<label class="check"><input type="checkbox" name="consent" required><span>Acepto que me contacten por WhatsApp y el <a href="/aviso-de-privacidad.html" target="_blank">aviso de privacidad</a>.</span></label>' +
      '<p class="form-msg" id="lead-msg" role="status" aria-live="polite"></p>' +
      '<button class="btn btn-primary block" type="submit"><span>' + e(k.button) + '</span>' + icon('arrow') + '</button></form></div></section>';
  };

  R.cta = function (c) {
    var k = c.cta;
    return '<section class="sec final"><div class="final-card"' + rv(0) + '><h2>' + hl(k.title) + '</h2><p class="lead">' + e(k.sub) + '</p>' +
      '<a class="btn btn-light" href="' + e(S.waLink(c.brand.whatsapp, 'Hola, quiero platicar sobre marketing para mi negocio.')) + '" target="_blank" rel="noopener" data-track="cta_clicked" data-where="cta_final"><span>' + e(k.button) + '</span>' + icon('wa') + '</a></div></section>';
  };

  /* ---------- piezas fijas ---------- */
  function sunDisc() {
    return '<svg class="sun" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="var(--accent)"/><circle cx="100" cy="100" r="92" fill="url(#sg)"/><defs><radialGradient id="sg" cx=".3" cy=".25"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs></svg>';
  }

  function header(c) {
    var links = [['#servicios', 'Servicios'], ['#proceso', 'Proceso'], ['#paquetes', 'Paquetes'], ['#calculadora', 'Calculadora'], ['#faq', 'Preguntas']];
    return '<a class="skip" href="#main">Saltar al contenido</a>' +
      (c.announce.enabled && c.announce.text ? '<div class="announce"><span>' + e(c.announce.text) + '</span>' + (c.announce.link ? ' <a href="' + e(S.safeUrl(c.announce.link)) + '">' + e(c.announce.linkText) + '</a>' : '') + '</div>' : '') +
      '<header class="top" id="top"><div class="top-in"><a class="logo" href="/" aria-label="' + e(c.brand.name) + ', inicio"><span class="logo-mark" aria-hidden="true"><i></i></span><span>' + e(c.brand.name) + '</span></a>' +
      '<nav class="nav" id="nav" aria-label="Principal">' + links.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + '</a>'; }).join('') +
      '<a class="nav-m" href="/auth.html">Entrar</a><a class="nav-m strong" href="/auth.html?mode=register">Crear cuenta</a></nav>' +
      '<div class="top-cta"><a class="btn-txt" href="/auth.html">Entrar</a><a class="btn btn-sm btn-dark" href="/auth.html?mode=register"><span>Crear cuenta</span></a></div>' +
      '<button class="burger" id="burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav"><i></i><i></i></button></div></header>';
  }

  function hero(c) {
    var h = c.hero, ex = S.exampleClientData(), t = S.totals(ex);
    return '<section class="hero" id="inicio"><div class="hero-bg" aria-hidden="true"><div class="waves"></div>' + sunDisc() + '<span class="jp v">ライン・フロンティア</span></div>' +
      '<div class="hero-in"><div class="hero-copy"><span class="pill" data-reveal style="--i:0"><i class="live"></i>' + e(h.badge) + '</span>' +
      '<h1 data-reveal style="--i:1">' + hl(h.title) + '</h1><p class="lead" data-reveal style="--i:2">' + e(h.sub) + '</p>' +
      '<div class="cta-row" data-reveal style="--i:3"><a class="btn btn-primary" href="#contacto" data-track="cta_clicked" data-where="hero_diagnostico"><span>' + e(h.cta1) + '</span>' + icon('arrow') + '</a>' +
      '<a class="btn btn-ghost" href="#paquetes" data-track="cta_clicked" data-where="hero_paquetes"><span>' + e(h.cta2) + '</span></a></div>' +
      (h.note ? '<p class="fine" data-reveal style="--i:4">' + e(h.note) + '</p>' : '') + '</div>' +
      '<div class="hero-vis" aria-hidden="true"><div class="float f1"><span>Leads (ejemplo)</span><strong>' + S.num(t.leads) + '</strong>' + areaChart(ex.series.map(function (r) { return r.leads; }), 200, 50) + '</div>' +
      '<div class="float f2"><span class="dot on"></span> Campaña activa<small>Mensajes WhatsApp</small></div>' +
      '<div class="float f3"><span>Google · #3</span><small>dentista en tijuana</small></div><span class="hero-tag">Datos de ejemplo</span></div></div></section>';
  }

  function ticker(c) {
    var items = c.ticker.map(function (t) { return '<span>' + e(t) + '</span>'; }).join('<i aria-hidden="true">✦</i>');
    return '<div class="ticker" aria-hidden="true"><div class="ticker-track"><div>' + items + '<i>✦</i></div><div>' + items + '<i>✦</i></div></div></div>';
  }

  function footer(c) {
    var b = c.brand, yr = new Date().getFullYear();
    return '<footer class="foot"><div class="foot-in"><div><a class="logo light" href="/"><span class="logo-mark" aria-hidden="true"><i></i></span><span>' + e(b.name) + '</span></a><p>' + e(b.tagline) + '</p></div>' +
      '<div><h4>Contacto</h4><a href="' + e(S.waLink(b.whatsapp)) + '" target="_blank" rel="noopener">WhatsApp ' + e(b.whatsapp) + '</a><a href="mailto:' + e(b.email) + '">' + e(b.email) + '</a><span>' + e(b.city) + '</span></div>' +
      '<div><h4>Cuenta</h4><a href="/auth.html">Entrar</a><a href="/auth.html?mode=register">Crear cuenta</a><a href="/aviso-de-privacidad.html">Aviso de privacidad</a><a href="/terminos.html">Términos</a></div></div>' +
      '<p class="copy">© ' + yr + ' ' + e(b.name) + ' · ' + e(b.domain) + '</p></footer>' +
      '<a class="wa-fab" href="' + e(S.waLink(b.whatsapp, 'Hola, vengo de la página de Línea Frontera.')) + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" data-track="cta_clicked" data-where="fab">' + icon('wa') + '</a>';
  }

  function renderBody(c) {
    c = S.resolveContent(c);
    var hidden = c.sections.hidden, out = [];
    c.sections.order.forEach(function (id) { if (hidden.indexOf(id) < 0 && R[id]) out.push(R[id](c)); });
    return header(c) + '<main id="main">' + hero(c) + ticker(c) + out.join('') + '</main>' + footer(c);
  }

  function renderJsonLd(c) {
    c = S.resolveContent(c);
    var url = 'https://' + c.brand.domain + '/';
    var graph = [
      { '@type': 'WebSite', '@id': url + '#site', url: url, name: c.brand.name, inLanguage: 'es-MX' },
      { '@type': 'ProfessionalService', '@id': url + '#org', name: c.brand.name, url: url, description: c.seo.description, email: c.brand.email, telephone: '+' + S.normalizeWhatsApp(c.brand.whatsapp),
        areaServed: { '@type': 'City', name: 'Tijuana' }, address: { '@type': 'PostalAddress', addressLocality: 'Tijuana', addressRegion: 'Baja California', addressCountry: 'MX' },
        priceRange: '$$',
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Paquetes de marketing', itemListElement: c.packages.items.map(function (p) {
          return { '@type': 'Offer', name: p.name, description: p.tagline, price: String(p.price), priceCurrency: 'MXN', itemOffered: { '@type': 'Service', name: 'Paquete ' + p.name } };
        }) } },
      { '@type': 'FAQPage', mainEntity: c.faq.map(function (q) { return { '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } }; }) }
    ];
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  }

  function themeCss(c) {
    var t = S.resolveContent(c).theme;
    return ':root{--accent:' + t.accent + ';--accent2:' + t.accent2 + ';--accent3:' + t.accent3 + ';--sun:' + t.sun + ';--sakura:' + t.sakura + ';--ink:' + t.ink + ';--paper:' + t.paper + '}';
  }

  g.LF = g.LF || {};
  g.LF.render = { renderBody: renderBody, renderJsonLd: renderJsonLd, themeCss: themeCss, icon: icon, areaChart: areaChart };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.LF.render;
})(typeof window !== 'undefined' ? window : globalThis);
