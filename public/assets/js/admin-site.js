/* Admin · editor del sitio: controla todo el contenido, colores, SEO, secciones y paquetes con vista previa en vivo */
(function (g) {
  'use strict';
  var S = g.LF.shared, R = g.LF.render, api = g.LF.api, ui = g.LF.ui, K = g.LF.kit, A = g.LF.admin, e = S.esc, st = A.st;
  var cur = null, base = null, dirty = false, open = { hero: 1 }, mobile = false, pt;

  var GROUPS = [['brand', 'Marca y contacto'], ['announce', 'Barra superior'], ['theme', 'Colores'], ['seo', 'SEO y analítica'], ['sections', 'Secciones: orden y visibilidad'], ['hero', 'Portada'], ['ticker', 'Cinta de palabras'], ['problem', 'Problemas'], ['services', 'Servicios'], ['process', 'Proceso'], ['demo', 'Panel de ejemplo'], ['packages', 'Paquetes y precios'], ['calculator', 'Calculadora'], ['audience', 'Para quién'], ['proof', 'Confianza y testimonios'], ['faq', 'Preguntas frecuentes'], ['contact', 'Formulario de contacto'], ['cta', 'Llamada final']];
  var SEC = { problem: 'Problemas', services: 'Servicios', process: 'Proceso', demo: 'Panel de ejemplo', packages: 'Paquetes', calculator: 'Calculadora', audience: 'Para quién', proof: 'Confianza', faq: 'Preguntas frecuentes', contact: 'Contacto', cta: 'Llamada final' };
  var L = { name: 'Nombre', tagline: 'Frase corta', whatsapp: 'WhatsApp (10 dígitos)', email: 'Correo', city: 'Ciudad', domain: 'Dominio (sin https)', instagram: 'Instagram (URL)', facebook: 'Facebook (URL)', tiktok: 'TikTok (URL)', accent: 'Principal (rojo)', accent2: 'Secundario (violeta)', accent3: 'Menta', sun: 'Sol (amarillo)', sakura: 'Sakura (rosa)', ink: 'Tinta (oscuro)', paper: 'Fondo', title: 'Título', description: 'Descripción para Google', ga4: 'Google Analytics 4 (G-XXXXXXX)', metaPixel: 'Meta Pixel (solo números)', enabled: 'Mostrar', text: 'Texto', link: 'Enlace', linkText: 'Texto del enlace', badge: 'Etiqueta', sub: 'Subtítulo', cta1: 'Botón principal', cta2: 'Botón secundario', note: 'Nota', items: 'Elementos', icon: 'Icono', t: 'Título', d: 'Descripción', steps: 'Pasos', price: 'Precio (MXN por mes)', featured: 'Destacado', stripePriceId: 'Stripe Price ID (price_…)', paymentLink: 'Enlace de pago (Stripe Payment Link)', features: 'Beneficios (uno por línea)', id: 'Identificador interno', addons: 'Extras', chips: 'Etiquetas (una por línea)', commitments: 'Compromisos', testimonials: 'Testimonios (solo se muestran los que tienen texto)', role: 'Negocio o cargo', button: 'Texto del botón', success: 'Mensaje al enviar', q: 'Pregunta', a: 'Respuesta', ticker: 'Palabras (una por línea)', hidden: 'Ocultas' };
  var LONG = { a: 1, d: 1, sub: 1, description: 1, text: 1, note: 1, message: 1 };
  var ICONS = ['megaphone', 'film', 'pin', 'chat', 'chart', 'window', 'star'];
  var BLANK = { 'problem.items': { t: '', d: '' }, 'services.items': { icon: 'star', t: '', d: '' }, 'process.steps': { t: '', d: '' }, 'packages.items': { id: '', name: 'Nuevo paquete', tagline: '', price: 0, featured: false, badge: '', stripePriceId: '', paymentLink: '', features: [] }, 'packages.addons': { name: '', price: 'Cotiza' }, 'proof.commitments': { t: '', d: '' }, 'proof.testimonials': { name: '', role: '', text: '' }, faq: { q: '', a: '' } };

  function getP(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setP(o, path, v) { var p = path.split('.'), a = o; for (var i = 0; i < p.length - 1; i++) a = a[p[i]]; a[p[p.length - 1]] = v; }
  function label(k, path) { return L[k] || k; }

  function fields(val, path) {
    var k = path.split('.').pop(), h = '';
    if (Array.isArray(val)) {
      if (!val.length || typeof val[0] !== 'object') return '<label class="fld"><span>' + e(label(k)) + '</span><textarea data-sp="' + path + '" data-lines rows="' + Math.min(10, Math.max(3, val.length + 1)) + '">' + e(val.join('\n')) + '</textarea></label>' + (val.length === 0 && BLANK[path] ? '' : '');
      return '<div class="fld"><span>' + e(label(k)) + '</span></div>' + val.map(function (it, i) {
        var p = path + '.' + i, title = it.name || it.t || it.q || ('Elemento ' + (i + 1));
        return '<div class="rep"><div class="rep-h"><span>' + (i + 1) + '. ' + e(String(title).slice(0, 50)) + '</span><div><button class="btn-icon" type="button" data-s="up" data-path="' + path + '" data-i="' + i + '" aria-label="Subir">' + K.ic('up') + '</button><button class="btn-icon" type="button" data-s="down" data-path="' + path + '" data-i="' + i + '" aria-label="Bajar">' + K.ic('down') + '</button><button class="btn-icon danger" type="button" data-s="rm" data-path="' + path + '" data-i="' + i + '" aria-label="Quitar">' + K.ic('trash') + '</button></div></div>' + fields(it, p) + '</div>';
      }).join('') + (BLANK[path] ? '<button class="btn btn-ghost btn-sm" type="button" data-s="add" data-path="' + path + '" style="justify-self:start"><span>' + K.ic('plus') + ' Agregar</span></button>' : '');
    }
    if (val && typeof val === 'object') return Object.keys(val).map(function (kk) { return fields(val[kk], path + '.' + kk); }).join('');
    if (typeof val === 'boolean') return '<label class="check"><input type="checkbox" data-sp="' + path + '"' + (val ? ' checked' : '') + '><span>' + e(label(k)) + '</span></label>';
    if (typeof val === 'number') return '<label class="fld"><span>' + e(label(k)) + '</span><input type="number" inputmode="decimal" data-sp="' + path + '" value="' + e(val) + '"></label>';
    if (path.indexOf('theme.') === 0) return '<div class="fld"><span>' + e(label(k)) + '</span><div class="color-row"><input type="color" data-sp="' + path + '" value="' + e(val) + '" aria-label="' + e(label(k)) + '"><code>' + e(val) + '</code></div></div>';
    if (k === 'icon') return '<label class="fld"><span>' + e(label(k)) + '</span><select data-sp="' + path + '">' + ICONS.map(function (i) { return '<option' + (i === val ? ' selected' : '') + '>' + i + '</option>'; }).join('') + '</select></label>';
    if (LONG[k]) return '<label class="fld"><span>' + e(label(k)) + '</span><textarea data-sp="' + path + '" rows="3">' + e(val) + '</textarea></label>';
    return '<label class="fld"><span>' + e(label(k)) + '</span><input data-sp="' + path + '" value="' + e(val) + '"' + (/link|url|href/i.test(k) ? ' placeholder="https://… o #seccion"' : '') + '></label>';
  }

  function sectionsUi() {
    var o = cur.sections.order, hid = cur.sections.hidden;
    return '<p class="hint">Ordena y oculta secciones de la página principal.</p>' + o.map(function (id, i) {
      return '<div class="item"><label class="check" style="flex:1"><input type="checkbox" data-s="vis" data-id="' + id + '"' + (hid.indexOf(id) < 0 ? ' checked' : '') + '><span>' + e(SEC[id] || id) + '</span></label><button class="btn-icon" type="button" data-s="sup" data-i="' + i + '" aria-label="Subir">' + K.ic('up') + '</button><button class="btn-icon" type="button" data-s="sdown" data-i="' + i + '" aria-label="Bajar">' + K.ic('down') + '</button></div>';
    }).join('');
  }

  function form() {
    return GROUPS.map(function (gr) {
      var k = gr[0];
      return '<details class="acc" data-g="' + k + '"' + (open[k] ? ' open' : '') + '><summary>' + e(gr[1]) + '</summary><div class="acc-in">' + (k === 'sections' ? sectionsUi() : fields(cur[k], k)) + '</div></details>';
    }).join('');
  }

  function previewDoc() {
    var c = S.resolveContent(cur);
    return '<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@900&display=swap"><style>' + R.themeCss(c) + '</style><link rel="stylesheet" href="/assets/css/base.css"><link rel="stylesheet" href="/assets/css/site.css"><style>[data-reveal]{opacity:1!important;transform:none!important}html{scroll-behavior:auto}</style></head><body>' + R.renderBody(c) + '</body></html>';
  }
  var lastY = 0;
  function preview() {
    var f = document.getElementById('pv'); if (!f) return;
    try { lastY = f.contentWindow.scrollY || lastY; } catch (x) { /* noop */ }
    f.onload = function () { try { f.contentWindow.scrollTo(0, lastY); } catch (x) { /* noop */ } };
    f.srcdoc = previewDoc();
  }
  var preview2 = ui.debounce(preview, 300);

  function setDirty(v) { dirty = v; var d = document.getElementById('sdirty'); if (d) d.hidden = !v; var b = document.getElementById('ssave'); if (b) b.disabled = !v; }

  function paint(keep) {
    var v = document.getElementById('view'), y = window.scrollY;
    v.innerHTML = A.head('Sitio', 'Edita todo lo que ve la gente en lineafrontera.stream. Los cambios se ven a la derecha antes de publicar.',
      '<a class="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener"><span>' + K.ic('eye') + ' Ver sitio</span></a>') +
      '<div class="ed"><div><div class="ed-form" id="eform">' + form() + '</div><div class="savebar"><span class="dirty" id="sdirty" hidden>Cambios sin publicar</span><span class="grow" style="flex:1"></span><button class="btn-icon" type="button" data-s="versions" title="Versiones" aria-label="Versiones">' + K.ic('history') + '</button><button class="btn btn-ghost btn-sm" type="button" data-s="more"><span>Más</span></button><button class="btn btn-primary btn-sm" id="ssave" type="button" data-s="save" disabled><span>Publicar cambios</span></button></div></div>' +
      '<div class="preview' + (mobile ? ' mobile' : '') + '"><div class="preview-bar"><b>Vista previa</b><span class="grow" style="flex:1"></span><button class="btn-icon" type="button" data-s="device" aria-label="Cambiar tamaño" title="Móvil / escritorio">' + K.ic('phone') + '</button></div><iframe id="pv" title="Vista previa del sitio" sandbox="allow-same-origin allow-popups"></iframe></div></div>';
    setDirty(dirty); preview(); if (keep) window.scrollTo(0, y);
  }

  A.views.sitio = function () {
    if (cur) { return ''; }
    return api.get('/admin/content').then(function (r) {
      if (!r.ok) return A.head('Sitio') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      cur = S.clone(r.data.content); base = JSON.stringify(cur); dirty = false; return '';
    });
  };
  A.views.sitio.after = function () { paint(); };

  function structural() { var y = window.scrollY, f = document.getElementById('eform'); f.innerHTML = form(); window.scrollTo(0, y); setDirty(true); preview2(); }

  document.addEventListener('input', function (ev) {
    var t = ev.target, p = t.dataset && t.dataset.sp; if (!p || !cur || st.view !== 'sitio') return;
    var v = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (parseFloat(t.value) || 0) : t.hasAttribute('data-lines') ? t.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) : t.value;
    setP(cur, p, v); if (t.type === 'color' && t.nextElementSibling) t.nextElementSibling.textContent = v; setDirty(true); preview2();
  });
  document.addEventListener('toggle', function (ev) { var d = ev.target; if (d.dataset && d.dataset.g) open[d.dataset.g] = d.open ? 1 : 0; }, true);

  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var x = arr.splice(i, 1)[0]; arr.splice(j, 0, x); }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-s]'); if (!t || !cur || st.view !== 'sitio') return; var s = t.dataset.s, p = t.dataset.path, i = +t.dataset.i;
    if (s === 'up' || s === 'down') { move(getP(cur, p), i, s === 'up' ? -1 : 1); return structural(); }
    if (s === 'rm') return ui.confirm('¿Quitar este elemento?', '', 'Quitar', true).then(function (ok) { if (ok) { getP(cur, p).splice(i, 1); structural(); } });
    if (s === 'add') { var b = S.clone(BLANK[p]); if (b.id === '') b.id = 'pkg' + Math.random().toString(36).slice(2, 6); getP(cur, p).push(b); return structural(); }
    if (s === 'sup' || s === 'sdown') { move(cur.sections.order, i, s === 'sup' ? -1 : 1); return structural(); }
    if (s === 'vis') { var h = cur.sections.hidden, id = t.dataset.id, ix = h.indexOf(id); if (t.checked && ix > -1) h.splice(ix, 1); if (!t.checked && ix < 0) h.push(id); setDirty(true); return preview2(); }
    if (s === 'device') { mobile = !mobile; document.querySelector('.preview').classList.toggle('mobile', mobile); return; }
    if (s === 'save') { t.disabled = true; return api.put('/admin/content', { content: cur, label: 'Editor del sitio' }).then(function (r) { if (!r.ok) { t.disabled = false; return A.fail(r); } cur = S.clone(r.data.content); st.content = S.resolveContent(cur); base = JSON.stringify(cur); setDirty(false); ui.toast('Publicado. Tu sitio ya muestra los cambios.'); }); }
    if (s === 'versions') return versions();
    if (s === 'more') return more();
  });

  function versions() {
    api.get('/admin/versions').then(function (r) {
      if (!r.ok) return A.fail(r);
      var d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = '<div class="modal-in"><h3>Versiones publicadas</h3><div class="list" style="max-height:50vh;overflow:auto">' + (r.data.versions.length ? r.data.versions.map(function (v) { return '<div class="item"><div class="grow"><h4>' + e(v.label || 'Versión') + ' · #' + v.id + '</h4><small>' + e(ui.fmtDate(v.created_at, true)) + ' · ' + e(v.author || '') + '</small></div><button class="btn btn-sm btn-ghost" type="button" data-rv="' + v.id + '"><span>Restaurar</span></button></div>'; }).join('') : '<p class="hint">Aún no has publicado cambios.</p>') + '</div><div class="row-btns"><button class="btn btn-ghost btn-sm" type="button" data-x><span>Cerrar</span></button></div></div>';
      document.body.appendChild(d); function end() { d.close(); setTimeout(function () { d.remove(); }, 300); }
      d.addEventListener('click', function (ev) { var b = ev.target.closest('[data-rv]'); if (b) api.post('/admin/versions/' + b.dataset.rv + '/restore').then(function (r2) { if (!r2.ok) return A.fail(r2); cur = S.clone(r2.data.content); st.content = S.resolveContent(cur); base = JSON.stringify(cur); dirty = false; end(); paint(true); ui.toast('Versión restaurada y publicada'); }); });
      d.querySelector('[data-x]').onclick = end; d.addEventListener('cancel', function (ev) { ev.preventDefault(); end(); }); d.showModal();
    });
  }
  function more() {
    var d = document.createElement('dialog'); d.className = 'modal';
    d.innerHTML = '<div class="modal-in"><h3>Más opciones</h3><button class="btn btn-ghost block" type="button" data-m="discard"><span>Descartar cambios sin publicar</span></button><button class="btn btn-ghost block" type="button" data-m="reset"><span>Volver a los textos originales</span></button><label class="btn btn-ghost block" style="cursor:pointer"><span>Importar JSON</span><input type="file" accept="application/json,.json" hidden data-m="import"></label><div class="row-btns"><button class="btn btn-ghost btn-sm" type="button" data-x><span>Cerrar</span></button></div></div>';
    document.body.appendChild(d); function end() { d.close(); setTimeout(function () { d.remove(); }, 300); }
    d.querySelector('[data-x]').onclick = end; d.addEventListener('cancel', function (ev) { ev.preventDefault(); end(); });
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-m]'); if (!b) return;
      if (b.dataset.m === 'discard') { cur = JSON.parse(base); dirty = false; end(); paint(true); }
      if (b.dataset.m === 'reset') ui.confirm('¿Volver a los textos originales?', 'Se cargan en el editor; no se publica hasta que lo confirmes.', 'Cargar originales', true).then(function (ok) { if (ok) { cur = S.clone(S.DEFAULTS); dirty = true; end(); paint(true); setDirty(true); } });
    });
    d.querySelector('input[data-m=import]').addEventListener('change', function (ev) {
      var f = ev.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { cur = S.sanitizeContent(JSON.parse(rd.result)); end(); paint(true); setDirty(true); ui.toast('Importado. Revisa y publica.'); } catch (x) { ui.toast('Ese archivo no es un JSON válido'); } }; rd.readAsText(f);
    });
    d.showModal();
  }
  window.addEventListener('beforeunload', function (ev) { if (dirty) { ev.preventDefault(); ev.returnValue = ''; } });
  A.siteDirty = function () { return dirty; };
  A.siteReset = function () { cur = null; dirty = false; };
})(window);
