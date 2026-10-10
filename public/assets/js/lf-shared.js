/* Línea Frontera · utilidades y contenido por defecto (navegador + Node + Workers) */
(function (g) {
  'use strict';

  var SECTION_IDS = ['problem', 'services', 'process', 'demo', 'packages', 'calculator', 'audience', 'proof', 'faq', 'contact', 'cta'];

  var DEFAULTS = {
    brand: {
      name: 'Línea Frontera',
      tagline: 'Marketing chill para negocios de Tijuana',
      whatsapp: '5632960874',
      email: 'rcabrerar17@gmail.com',
      city: 'Tijuana, Baja California',
      domain: 'lineafrontera.stream',
      instagram: '',
      facebook: '',
      tiktok: ''
    },
    theme: { accent: '#FF3B5C', accent2: '#6C4DFF', accent3: '#3DDBB0', sun: '#FFC93C', sakura: '#FF8FB1', ink: '#17112E', paper: '#FFF8F0' },
    seo: {
      title: 'Línea Frontera · Marketing para negocios de Tijuana',
      description: 'Anuncios, contenido y SEO local para negocios de Tijuana. Paquetes mensuales desde $4,900 MXN con panel de resultados. Pide tu diagnóstico gratis.',
      ga4: '',
      metaPixel: ''
    },
    announce: { enabled: true, text: 'Diagnóstico gratis para negocios de Tijuana. Cupo de nuevos clientes cada mes.', link: '#contacto', linkText: 'Pedirlo' },
    sections: { order: SECTION_IDS.slice(), hidden: [] },
    hero: {
      badge: 'Agencia de Tijuana',
      title: 'Haz que Tijuana te ||encuentre||, te escriba y te compre.',
      sub: 'Juntamos anuncios, contenido y SEO local en un solo plan mensual. Tú ves cuántos mensajes y ventas llegaron en tu panel, sin tecnicismos.',
      cta1: 'Pedir diagnóstico gratis',
      cta2: 'Ver paquetes',
      note: 'Sin contrato forzoso. Tu inversión en anuncios se paga directo a Meta y Google.'
    },
    ticker: ['Anuncios en Meta', 'Google Business', 'Reels y TikTok', 'SEO local', 'WhatsApp que vende', 'Panel de resultados', 'Páginas de aterrizaje', 'Reseñas'],
    problem: {
      title: 'Si algo de esto te suena, vamos a trabajar bien juntos',
      items: [
        { t: 'Publico y no pasa nada', d: 'Subes contenido seguido y los mensajes no llegan. Falta alguien que conecte lo que publicas con lo que la gente busca.' },
        { t: 'Pagué anuncios y no sé qué pasó', d: 'Gastaste, te dieron un reporte lleno de números y sigues sin saber cuántas ventas fueron. Aquí ves leads, costo por lead y ventas.' },
        { t: 'Mi competencia sale primero en Google', d: 'Cuando alguien busca tu servicio en Tijuana, aparece otro. Con SEO local y reseñas te movemos hacia arriba.' }
      ]
    },
    services: {
      title: 'Todo lo que necesita tu negocio para vender más',
      sub: 'Cada servicio se puede contratar dentro de un paquete. Todos terminan en el mismo lugar: más mensajes de gente que sí quiere comprar.',
      items: [
        { icon: 'megaphone', t: 'Anuncios que traen mensajes', d: 'Campañas en Meta y Google con presupuesto cuidado, pruebas de creativos y ajustes cada semana.' },
        { icon: 'film', t: 'Contenido con intención', d: 'Reels, fotos y carruseles pensados para que te recuerden y te escriban. Grabamos en tu local.' },
        { icon: 'pin', t: 'SEO local y Google Business', d: 'Ficha optimizada, reseñas, citas y páginas por servicio para que aparezcas cuando te buscan cerca.' },
        { icon: 'chat', t: 'WhatsApp que cierra ventas', d: 'Mensajes de bienvenida, respuestas rápidas y seguimiento para que ningún prospecto se quede esperando.' },
        { icon: 'chart', t: 'Panel de KPIs en tiempo real', d: 'Leads, costo por lead, ventas y retorno en un panel claro. Lo revisas cuando quieras.' },
        { icon: 'window', t: 'Páginas de aterrizaje', d: 'Una página rápida y simple para cada campaña, medida con eventos para saber qué funciona.' }
      ]
    },
    process: {
      title: 'Así arrancamos, paso por paso',
      steps: [
        { t: 'Diagnóstico gratis', d: 'Revisamos tu presencia en Google, redes y anuncios, y te decimos dónde está el dinero que hoy se te escapa.' },
        { t: 'Plan y paquete', d: 'Eliges el paquete que te acomoda y firmamos objetivos claros: mensajes, citas o ventas por mes.' },
        { t: 'Producción y lanzamiento', d: 'Grabamos, publicamos y encendemos campañas. En la primera semana ya hay algo corriendo.' },
        { t: 'Medimos y mejoramos', d: 'Cada mes revisamos resultados contigo y movemos presupuesto hacia lo que sí vende.' }
      ]
    },
    demo: {
      title: 'Así se ve tu panel de resultados',
      sub: 'Cada cliente tiene su cuenta con campañas, contenido por aprobar, posiciones en Google y tickets de soporte. Los números de abajo son un ejemplo para mostrar el panel.'
    },
    packages: {
      title: 'Paquetes mensuales, precios claros',
      sub: 'Precios en pesos mexicanos por mes. La inversión en anuncios se paga aparte, directo a Meta y Google, y tú controlas el monto.',
      note: 'Sin plazo forzoso: puedes pausar cuando lo necesites con 30 días de aviso.',
      items: [
        { id: 'arranque', name: 'Arranque', tagline: 'Para empezar a aparecer y recibir mensajes', price: 4900, featured: false, badge: '', stripePriceId: '', paymentLink: '',
          features: ['Google Business optimizado', '8 piezas de contenido al mes', 'Calendario y publicación en Instagram y Facebook', '1 campaña de anuncios en Meta', 'Panel mensual con tus números', 'Soporte por WhatsApp en horario hábil'] },
        { id: 'crecimiento', name: 'Crecimiento', tagline: 'Para crecer ventas con anuncios y SEO local', price: 9900, featured: true, badge: 'Más elegido', stripePriceId: '', paymentLink: '',
          features: ['Todo lo de Arranque', '16 piezas al mes y 1 sesión de grabación', 'SEO local: reseñas, citas y páginas por servicio', 'Campañas en Meta y Google Búsqueda', 'Seguimiento de leads a ventas por WhatsApp', 'Reunión mensual de resultados'] },
        { id: 'dominancia', name: 'Dominancia', tagline: 'Para liderar tu zona y escalar', price: 16500, featured: false, badge: '', stripePriceId: '', paymentLink: '',
          features: ['Todo lo de Crecimiento', '24 piezas al mes y 2 sesiones de grabación', 'Landing page para campañas', 'Reactivación de clientes por WhatsApp y email', 'Reporte semanal', 'Soporte prioritario'] }
      ],
      addons: [
        { name: 'Sesión extra de grabación', price: 'Cotiza' },
        { name: 'Landing page adicional', price: 'Cotiza' },
        { name: 'Identidad visual', price: 'Cotiza' }
      ]
    },
    calculator: {
      title: '¿Cuántas ventas necesitas para que se pague solo?',
      sub: 'Mueve los números con los de tu negocio. Es una estimación para planear, no una promesa de resultados.'
    },
    audience: {
      title: 'Trabajamos con negocios locales, con especialidad en salud',
      sub: 'Consultorios, clínicas, dentistas, estéticas, laboratorios y también restaurantes, gimnasios, tiendas y servicios de Tijuana.',
      chips: ['Dentistas', 'Clínicas', 'Consultorios', 'Estética y spa', 'Laboratorios', 'Gimnasios', 'Restaurantes', 'Tiendas locales', 'Servicios del hogar']
    },
    proof: {
      title: 'Cómo cuidamos tu inversión',
      commitments: [
        { t: 'Tus cuentas son tuyas', d: 'Las cuentas de anuncios, Google Business y redes quedan a tu nombre. Si decides irte, te llevas todo.' },
        { t: 'Reporte que se entiende', d: 'Leads, costo por lead y ventas en español claro. Si un número no sube, te decimos por qué y qué haremos.' },
        { t: 'Sin letra chiquita', d: 'Sin plazo forzoso. Avisas con 30 días y pausamos, sin penalización.' },
        { t: 'Cupo limitado', d: 'Tomamos pocos clientes por mes para atender bien a cada uno.' }
      ],
      testimonials: []
    },
    faq: [
      { q: '¿La inversión en anuncios está incluida en el paquete?', a: 'No. El paquete cubre nuestro trabajo. El presupuesto de anuncios lo pagas directo a Meta y Google, tú decides el monto y ves cada peso gastado.' },
      { q: '¿Hay contrato o plazo forzoso?', a: 'No. Trabajamos mes a mes. Si quieres pausar, avisas con 30 días.' },
      { q: '¿En cuánto tiempo veo resultados?', a: 'Los anuncios pueden traer mensajes desde las primeras semanas. El SEO local suele tardar de 2 a 4 meses en moverse. Te lo explicamos en el diagnóstico con tu caso.' },
      { q: '¿Qué necesito para empezar?', a: 'Acceso a tus redes y a tu ficha de Google, o te ayudamos a crearlas. Con eso y una llamada de 30 minutos arrancamos.' },
      { q: '¿Me aseguran un número de ventas?', a: 'Nadie honesto puede asegurar ventas. Sí nos comprometemos a lo que controlamos: publicar, optimizar, reportar y mejorar cada mes.' },
      { q: '¿Trabajan con negocios que no son de salud?', a: 'Sí. Tenemos especialidad en salud, pero atendemos cualquier negocio local de Tijuana con clientes en la zona.' },
      { q: '¿Cómo pago?', a: 'Con tarjeta desde esta página o por transferencia. Te llega tu recibo y activamos tu cuenta con panel.' },
      { q: '¿Puedo ver mis resultados en tiempo real?', a: 'Sí. Al comprar un paquete tienes cuenta con panel donde ves campañas, contenido, posiciones en Google y puedes abrir tickets de soporte.' }
    ],
    contact: {
      title: 'Pide tu diagnóstico gratis',
      sub: 'Cuéntanos de tu negocio y te respondemos por WhatsApp el mismo día hábil con ideas concretas.',
      button: 'Quiero mi diagnóstico',
      success: 'Listo, recibimos tus datos. Te escribimos por WhatsApp pronto.'
    },
    cta: { title: 'Tu competencia ya está anunciándose. Tu turno.', sub: 'Platica con nosotros 20 minutos y sal con un plan para tu negocio.', button: 'Escribir por WhatsApp' }
  };

  var SHAPES = {
    'proof.testimonials': { name: '', role: '', text: '' }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"'`]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
  }

  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(https:\/\/|\/|#|mailto:|tel:)/i.test(u) && !/^\/\//.test(u)) return u.slice(0, 600);
    return '';
  }

  var HEX = /^#[0-9a-f]{6}$/i;

  /* Sanea `val` con la forma de `tpl`. Descarta claves desconocidas, fuerza tipos y longitudes. */
  function sanitize(val, tpl, path) {
    path = path || '';
    if (Array.isArray(tpl)) {
      if (!Array.isArray(val)) return clone(tpl);
      var itemTpl = SHAPES[path] !== undefined ? SHAPES[path] : tpl[0];
      if (itemTpl === undefined) itemTpl = '';
      var out = [];
      for (var i = 0; i < val.length && i < 60; i++) out.push(sanitize(val[i], itemTpl, path));
      return out;
    }
    if (tpl && typeof tpl === 'object') {
      var o = {};
      val = val && typeof val === 'object' ? val : {};
      Object.keys(tpl).forEach(function (k) {
        var p = path ? path + '.' + k : k;
        o[k] = k in val ? sanitize(val[k], tpl[k], p) : clone(tpl[k]);
      });
      return o;
    }
    if (typeof tpl === 'boolean') return val === true || val === 'true';
    if (typeof tpl === 'number') { var n = Number(val); return isFinite(n) ? Math.max(-1e9, Math.min(1e9, n)) : tpl; }
    var s = String(val == null ? '' : val).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    var key = path.split('.').pop();
    if (/^(accent|accent2|accent3|sun|sakura|ink|paper)$/.test(key) && path.indexOf('theme.') === 0) return HEX.test(s) ? s : tpl;
    if (/(link|url|href|paymentLink)$/i.test(key)) return safeUrl(s);
    if (key === 'whatsapp') return s.replace(/[^\d+ ]/g, '').slice(0, 20);
    if (key === 'id') return s.replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    return s.slice(0, key === 'a' || key === 'd' || key === 'sub' || key === 'description' || key === 'text' ? 1500 : 300);
  }

  function sanitizeContent(c) {
    var out = sanitize(c, DEFAULTS, '');
    var seen = {}, order = [];
    (c && c.sections && Array.isArray(c.sections.order) ? c.sections.order : []).forEach(function (id) {
      if (SECTION_IDS.indexOf(id) > -1 && !seen[id]) { seen[id] = 1; order.push(id); }
    });
    SECTION_IDS.forEach(function (id) { if (!seen[id]) order.push(id); });
    out.sections.order = order;
    out.sections.hidden = (c && c.sections && Array.isArray(c.sections.hidden) ? c.sections.hidden : []).filter(function (id) { return SECTION_IDS.indexOf(id) > -1; });
    var ids = {};
    out.packages.items.forEach(function (p, i) {
      if (!p.id || ids[p.id]) p.id = 'pkg' + (i + 1) + Math.random().toString(36).slice(2, 5);
      ids[p.id] = 1;
      if (p.price < 0) p.price = 0;
      p.stripePriceId = /^price_[A-Za-z0-9]+$/.test(p.stripePriceId) ? p.stripePriceId : '';
      if (!Array.isArray(p.features)) p.features = [];
    });
    return out;
  }

  /* Contenido guardado + defaults, siempre completo */
  function resolveContent(saved) { return sanitizeContent(saved && typeof saved === 'object' ? saved : {}); }

  function stable(o) {
    if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
    if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(o[k]); }).join(',') + '}';
    return JSON.stringify(o);
  }
  function contentHash(c) {
    var s = stable(c), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(36);
  }

  /* ---------- formato ---------- */
  function money(n) {
    n = Number(n);
    if (!isFinite(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function num(n) { n = Number(n); return isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0'; }
  function pct(n) { n = Number(n); return isFinite(n) ? (Math.round(n * 10) / 10) + '%' : '0%'; }

  function normalizeWhatsApp(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (d.length === 13 && d.indexOf('521') === 0) d = '52' + d.slice(3);
    if (d.length === 10) d = '52' + d;
    return d.length === 12 && d.indexOf('52') === 0 ? d : (d.length >= 11 && d.length <= 15 ? d : '');
  }
  function waLink(number, text) {
    var n = normalizeWhatsApp(number);
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }

  /* ---------- datos del cliente (portal) ---------- */
  var CLIENT_TPL = {
    plan: '',
    status: 'onboarding',
    notes: '',
    campaigns: [{ id: '', name: '', channel: 'Meta', status: 'activa', budget: 0, spent: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0, note: '' }],
    series: [{ date: '', spend: 0, leads: 0, sales: 0, revenue: 0 }],
    content: [{ id: '', title: '', type: 'Reel', status: 'por aprobar', date: '', url: '' }],
    seo: { rankings: [{ kw: '', pos: 0, prev: 0 }], gbp: { views: 0, calls: 0, directions: 0, reviews: 0, rating: 0 } },
    reports: [{ title: '', url: '' }],
    tasks: [{ id: '', title: '', done: false }]
  };
  var CLIENT_SHAPES = { 'campaigns': CLIENT_TPL.campaigns[0], 'series': CLIENT_TPL.series[0], 'content': CLIENT_TPL.content[0], 'seo.rankings': CLIENT_TPL.seo.rankings[0], 'reports': CLIENT_TPL.reports[0], 'tasks': CLIENT_TPL.tasks[0] };

  function sanitizeClientData(d) {
    // sanea con rutas propias para no chocar con las de contenido
    function walk(v, t, p) {
      if (Array.isArray(t)) {
        if (!Array.isArray(v)) return [];
        var it = CLIENT_SHAPES[p] !== undefined ? CLIENT_SHAPES[p] : t[0], out = [];
        for (var i = 0; i < v.length && i < (p === 'series' ? 400 : 200); i++) out.push(walk(v[i], it, p));
        return out;
      }
      if (t && typeof t === 'object') {
        var o = {}; v = v && typeof v === 'object' ? v : {};
        Object.keys(t).forEach(function (k) { o[k] = k in v ? walk(v[k], t[k], p ? p + '.' + k : k) : (Array.isArray(t[k]) ? [] : clone(t[k])); });
        return o;
      }
      if (typeof t === 'boolean') return v === true || v === 'true';
      if (typeof t === 'number') { var n = Number(v); return isFinite(n) ? Math.max(-1e12, Math.min(1e12, n)) : 0; }
      var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
      var key = p.split('.').pop();
      if (key === 'url') return safeUrl(s);
      if (key === 'id') return s.replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
      if (key === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
      return s.slice(0, key === 'notes' || key === 'note' ? 2000 : 200);
    }
    var out = walk(d, CLIENT_TPL, '');
    out.campaigns.forEach(function (c) { if (!c.id) c.id = uid('c'); });
    out.content.forEach(function (c) { if (!c.id) c.id = uid('k'); });
    out.tasks.forEach(function (c) { if (!c.id) c.id = uid('t'); });
    return out;
  }
  function emptyClientData() { return sanitizeClientData({}); }

  function exampleClientData() {
    var series = [], base = new Date(Date.UTC(2026, 8, 1));
    for (var i = 0; i < 30; i++) {
      var d = new Date(base.getTime() + i * 86400000);
      var w = 1 + Math.sin(i / 3) * 0.25 + i / 60;
      var spend = Math.round(180 * w), leads = Math.round(6 * w), sales = Math.round(leads * 0.3);
      series.push({ date: d.toISOString().slice(0, 10), spend: spend, leads: leads, sales: sales, revenue: sales * 650 });
    }
    return sanitizeClientData({
      plan: 'crecimiento', status: 'activo', notes: 'Datos de ejemplo.',
      campaigns: [
        { id: 'c1', name: 'Mensajes WhatsApp · Servicio estrella', channel: 'Meta', status: 'activa', budget: 4500, spent: 3120, impressions: 61200, clicks: 1480, leads: 92, sales: 27, revenue: 37800, note: 'Creativo 2 rinde mejor.' },
        { id: 'c2', name: 'Búsqueda local · Tijuana', channel: 'Google', status: 'activa', budget: 3000, spent: 2410, impressions: 14800, clicks: 760, leads: 51, sales: 16, revenue: 22400, note: '' },
        { id: 'c3', name: 'Remarketing', channel: 'Meta', status: 'pausada', budget: 1000, spent: 380, impressions: 9100, clicks: 140, leads: 8, sales: 2, revenue: 2800, note: 'En pausa mientras llega nuevo creativo.' }
      ],
      series: series,
      content: [
        { id: 'k1', title: 'Reel · Antes y después', type: 'Reel', status: 'por aprobar', date: '2026-10-12', url: '' },
        { id: 'k2', title: 'Carrusel · 5 dudas frecuentes', type: 'Carrusel', status: 'aprobado', date: '2026-10-10', url: '' },
        { id: 'k3', title: 'Foto · Equipo', type: 'Foto', status: 'publicado', date: '2026-10-05', url: '' }
      ],
      seo: { rankings: [{ kw: 'dentista en tijuana', pos: 6, prev: 11 }, { kw: 'limpieza dental zona río', pos: 3, prev: 4 }, { kw: 'ortodoncia tijuana', pos: 9, prev: 9 }], gbp: { views: 4120, calls: 138, directions: 211, reviews: 64, rating: 4.8 } },
      reports: [{ title: 'Reporte de septiembre', url: '' }],
      tasks: [{ id: 't1', title: 'Enviar fotos del consultorio', done: true }, { id: 't2', title: 'Aprobar calendario de octubre', done: false }]
    });
  }

  function totals(data) {
    var t = { spend: 0, leads: 0, sales: 0, revenue: 0 };
    (data.series || []).forEach(function (r) { t.spend += r.spend; t.leads += r.leads; t.sales += r.sales; t.revenue += r.revenue; });
    t.cpl = t.leads ? t.spend / t.leads : 0;
    t.close = t.leads ? t.sales / t.leads * 100 : 0;
    t.roas = t.spend ? t.revenue / t.spend : 0;
    return t;
  }

  function toCSV(rows, cols) {
    function cell(v) {
      v = String(v == null ? '' : v);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // evita inyección de fórmulas
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return '﻿' + [cols.join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(','); })).join('\r\n');
  }

  g.LF = g.LF || {};
  g.LF.shared = {
    SECTION_IDS: SECTION_IDS, DEFAULTS: DEFAULTS, clone: clone, esc: esc, safeUrl: safeUrl,
    sanitizeContent: sanitizeContent, resolveContent: resolveContent, contentHash: contentHash,
    money: money, num: num, pct: pct, normalizeWhatsApp: normalizeWhatsApp, waLink: waLink, uid: uid,
    sanitizeClientData: sanitizeClientData, emptyClientData: emptyClientData, exampleClientData: exampleClientData,
    totals: totals, toCSV: toCSV
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.LF.shared;
})(typeof window !== 'undefined' ? window : globalThis);
