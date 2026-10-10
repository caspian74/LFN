/* Portal del cliente */
(function (g) {
  'use strict';
  var S = g.LF.shared, api = g.LF.api, ui = g.LF.ui, K = g.LF.kit, e = S.esc;
  var root = document.getElementById('root');
  var st = { d: null, view: 'resumen', range: 14, content: null, ticket: null, loadedAt: 0 };
  var NAV = [['resumen', 'Resumen', 'home'], ['campanas', 'Campañas', 'megaphone'], ['contenido', 'Contenido', 'film'], ['seo', 'SEO local', 'pin'], ['pagos', 'Mi paquete', 'card'], ['soporte', 'Soporte', 'help'], ['cuenta', 'Cuenta', 'user']];

  function load(silent) {
    return api.get('/portal').then(function (r) {
      if (r.status === 401) { location.replace('/auth.html?next=' + encodeURIComponent('/dashboard.html')); return null; }
      if (!r.ok) { if (!silent) root.innerHTML = '<div class="center-page"><div class="auth-card"><h1>No pudimos cargar tu panel</h1><p class="muted">' + e(api.errText(r)) + '</p><button class="btn btn-primary" onclick="location.reload()"><span>Reintentar</span></button></div></div>'; return null; }
      var changed = st.d && JSON.stringify(st.d.client) !== JSON.stringify(r.data.client);
      st.d = r.data; st.loadedAt = Date.now();
      return changed ? 'changed' : 'ok';
    });
  }

  function cd() { return st.d.client ? st.d.client.data : S.emptyClientData(); }
  function hasPlan() { return st.d.client && st.d.client.plan; }
  function planName() { var p = st.content && st.content.packages.items.filter(function (x) { return x.id === st.d.client.plan; })[0]; return p ? p.name : st.d.client.plan; }
  function windowed(n) { var s = cd().series.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }); return n ? s.slice(-n) : s; }
  function sum(rows) { var t = { spend: 0, leads: 0, sales: 0, revenue: 0 }; rows.forEach(function (r) { t.spend += r.spend; t.leads += r.leads; t.sales += r.sales; t.revenue += r.revenue; }); t.cpl = t.leads ? t.spend / t.leads : 0; t.roas = t.spend ? t.revenue / t.spend : 0; return t; }

  /* ---------- vistas ---------- */
  var V = {};
  V.resumen = function () {
    var all = windowed(0), n = st.range, cur = n ? all.slice(-n) : all, prev = n ? all.slice(-2 * n, -n) : [], t = sum(cur), p = sum(prev), data = cd();
    var pending = data.content.filter(function (c) { return c.status === 'por aprobar'; }).length, tasks = data.tasks.filter(function (x) { return !x.done; });
    var steps = [['Cuenta creada', true], ['Paquete contratado', !!hasPlan()], ['Datos de campañas cargados', data.campaigns.length > 0], ['Primer contenido aprobado', data.content.some(function (c) { return c.status === 'aprobado' || c.status === 'publicado'; })]];
    var banner = !hasPlan() ? '<div class="alert" style="margin-bottom:16px"><b>Aún no tienes un paquete activo.</b> Elige uno para que empecemos a trabajar. <a href="#pagos"><b>Ver paquetes</b></a></div>' : '';
    var rangeSel = '<label class="fld" style="min-width:150px"><span class="sr">Periodo</span><select id="range">' + [[7, 'Últimos 7 días'], [14, 'Últimos 14 días'], [30, 'Últimos 30 días'], [0, 'Todo']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.range ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
    var chans = {}; data.campaigns.forEach(function (c) { chans[c.channel] = (chans[c.channel] || 0) + c.leads; });
    return head('Hola, ' + e((st.d.user.name || '').split(' ')[0]), (hasPlan() ? 'Paquete ' + e(planName()) + ' · ' : '') + 'así va tu marketing', rangeSel) + banner +
      '<div class="grid-a ga4">' + K.stat('Mensajes y leads', S.num(t.leads), K.delta(t.leads, p.leads), 'var(--accent)') + K.stat('Costo por lead', S.money(t.cpl), K.delta(t.cpl, p.cpl, true), 'var(--accent2)') +
      K.stat('Ventas cerradas', S.num(t.sales), K.delta(t.sales, p.sales), 'var(--accent3)') + K.stat('Retorno sobre anuncios', t.roas ? t.roas.toFixed(1) + 'x' : '—', t.revenue ? 'Ingresos ' + S.money(t.revenue) : '', 'var(--sun)') + '</div>' +
      '<div class="grid-a ga-1-2" style="margin-top:16px"><div class="panel"><h2>Leads y ventas por día</h2>' + K.line(cur, [{ key: 'leads', label: 'Leads', color: '#FF3B5C' }, { key: 'sales', label: 'Ventas', color: '#3DDBB0' }], { label: 'Leads y ventas por día' }) + '</div>' +
      '<div class="panel"><h2>Leads por canal</h2>' + K.donut(Object.keys(chans).map(function (k) { return { l: k, v: chans[k] }; })) + '<h2 style="margin-top:22px">Pendiente de ti</h2>' +
      (pending ? '<a class="item" href="#contenido"><div class="grow"><h4>' + pending + ' pieza' + (pending > 1 ? 's' : '') + ' por aprobar</h4><small>Revisa y aprueba para publicar</small></div>' + K.ic('arrow') + '</a>' : '<p class="hint">Nada por aprobar.</p>') +
      tasks.slice(0, 4).map(function (x) { return '<label class="check" style="margin-top:10px"><input type="checkbox" data-task="' + e(x.id) + '"><span>' + e(x.title) + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="panel" style="margin-top:16px"><h2>Tu arranque</h2><div class="prog" aria-hidden="true">' + steps.map(function (s) { return '<i class="' + (s[1] ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="grid-a ga4" style="margin-top:12px">' + steps.map(function (s) { return '<div class="hint">' + (s[1] ? '✓ ' : '○ ') + e(s[0]) + '</div>'; }).join('') + '</div></div>';
  };

  V.campanas = function () {
    var cs = cd().campaigns;
    return head('Campañas', 'Cada campaña con su presupuesto y resultados') + (cs.length ? '<div class="grid-a ga2">' + cs.map(function (c) {
      var pct = c.budget ? Math.min(100, c.spent / c.budget * 100) : 0, cpl = c.leads ? c.spent / c.leads : 0, cr = c.clicks ? c.leads / c.clicks * 100 : 0;
      return '<article class="panel"><div style="display:flex;gap:10px;justify-content:space-between;align-items:start"><div><h3 style="margin:0">' + e(c.name) + '</h3><span class="hint">' + e(c.channel) + '</span></div>' + K.tag(c.status) + '</div>' +
        '<div class="bar-row"><span class="hint">Gastado</span><div class="meter"><b style="width:' + pct + '%"></b></div><b>' + S.money(c.spent) + ' / ' + S.money(c.budget) + '</b></div>' +
        '<div class="grid-a ga3" style="margin-top:12px">' + mini('Leads', S.num(c.leads)) + mini('Costo por lead', c.leads ? S.money(cpl) : '—') + mini('Ventas', S.num(c.sales)) + mini('Impresiones', S.num(c.impressions)) + mini('Clics', S.num(c.clicks)) + mini('Clic a lead', c.clicks ? S.pct(cr) : '—') + '</div>' +
        (c.note ? '<p class="hint" style="margin-top:12px">Nota del equipo: ' + e(c.note) + '</p>' : '') + '</article>';
    }).join('') + '</div>' : empty('Todavía no hay campañas', 'Cuando lancemos tus anuncios aparecerán aquí con sus números.'));
  };
  function mini(l, v) { return '<div><div class="hint">' + e(l) + '</div><b style="font-size:1.1rem">' + e(v) + '</b></div>'; }

  V.contenido = function () {
    var cs = cd().content.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return head('Contenido', 'Aprueba lo que publicaremos o pide cambios') + (cs.length ? '<div class="list">' + cs.map(function (c) {
      return '<div class="item"><span class="svc-ic" style="width:44px;height:44px;margin:0;flex:none">' + K.ic('film') + '</span><div class="grow"><h4>' + e(c.title) + '</h4><small>' + e(c.type) + (c.date ? ' · ' + e(ui.fmtDate(c.date)) : '') + '</small></div>' + K.tag(c.status) +
        (c.url ? '<a class="btn-icon" href="' + e(c.url) + '" target="_blank" rel="noopener" aria-label="Ver pieza">' + K.ic('eye') + '</a>' : '') +
        (c.status === 'por aprobar' ? '<button class="btn btn-sm btn-primary" data-appr="' + e(c.id) + '" data-s="aprobado" type="button"><span>Aprobar</span></button><button class="btn btn-sm btn-ghost" data-appr="' + e(c.id) + '" data-s="cambios" type="button"><span>Pedir cambios</span></button>' : '') + '</div>';
    }).join('') + '</div>' : empty('Tu calendario está por llegar', 'Aquí verás cada pieza antes de que se publique.'));
  };

  V.seo = function () {
    var s = cd().seo, g1 = s.gbp;
    return head('SEO local', 'Cómo te encuentran en Google') + '<div class="grid-a ga4">' + K.stat('Vistas de tu ficha', S.num(g1.views), '', 'var(--accent2)') + K.stat('Llamadas', S.num(g1.calls), '', 'var(--accent)') + K.stat('Cómo llegar', S.num(g1.directions), '', 'var(--accent3)') + K.stat('Reseñas', S.num(g1.reviews), g1.rating ? '★ ' + g1.rating : '', 'var(--sun)') + '</div>' +
      '<div class="panel" style="margin-top:16px"><h2>Posiciones en Google</h2>' + (s.rankings.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Búsqueda</th><th class="num">Posición</th><th class="num">Antes</th><th>Cambio</th></tr></thead><tbody>' + s.rankings.map(function (r) {
        var d = r.prev && r.pos ? r.prev - r.pos : 0; return '<tr><td>' + e(r.kw) + '</td><td class="num"><b>#' + r.pos + '</b></td><td class="num">' + (r.prev ? '#' + r.prev : '—') + '</td><td>' + (d > 0 ? '<span class="up">▲ ' + d + '</span>' : d < 0 ? '<span class="down">▼ ' + (-d) + '</span>' : '<span class="muted">=</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="hint">Estamos definiendo las palabras clave de tu negocio.</p>') + '</div>' +
      '<div class="panel" style="margin-top:16px"><h2>Reportes</h2>' + (cd().reports.length ? '<div class="list">' + cd().reports.map(function (r) { return '<div class="item"><div class="grow"><h4>' + e(r.title) + '</h4></div>' + (r.url ? '<a class="btn btn-sm btn-ghost" href="' + e(r.url) + '" target="_blank" rel="noopener"><span>Abrir</span></a>' : '<span class="hint">Sin enlace</span>') + '</div>'; }).join('') + '</div>' : '<p class="hint">Tu primer reporte llegará al cerrar el mes.</p>') + '</div>';
  };

  V.pagos = function () {
    var c = st.d.client, pk = st.content ? st.content.packages.items : [];
    var cur = hasPlan() ? '<div class="panel" style="margin-bottom:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div class="grow" style="flex:1"><span class="hint">Paquete actual</span><h2 style="margin:0;font-size:1.6rem">' + e(planName()) + '</h2>' + K.tag(c.status) + '</div>' + (c.billing ? '<button class="btn btn-ghost btn-sm" id="billing" type="button"><span>Administrar pago y facturas</span></button>' : '') + '</div>' : '<div class="alert" style="margin-bottom:16px">Elige tu paquete. Al pagar activamos tu cuenta y arrancamos.</div>';
    return head('Mi paquete', 'Contratación y pagos') + cur + '<div class="grid-a ga3">' + pk.map(function (p) {
      var mine = c.plan === p.id; return '<article class="panel" style="' + (p.featured ? 'background:var(--ink);color:#fff' : '') + '"><h3>' + e(p.name) + '</h3><div style="font-family:var(--f-display);font-size:2rem;font-weight:800">' + S.money(p.price) + '<small style="font-size:.9rem;font-weight:500"> /mes</small></div><p class="hint" style="margin:8px 0 14px;' + (p.featured ? 'color:rgba(255,255,255,.7)' : '') + '">' + e(p.tagline) + '</p>' +
        (mine ? '<span class="tag ok">Tu paquete</span>' : '<button class="btn btn-sm ' + (p.featured ? 'btn-primary' : 'btn-dark') + ' block" data-buy="' + e(p.id) + '" type="button"><span>' + (hasPlan() ? 'Cambiar a ' : 'Contratar ') + e(p.name) + '</span></button>') + '</article>';
    }).join('') + '</div>' +
      '<div class="panel" style="margin-top:16px"><h2>Historial de pedidos</h2>' + (st.d.orders.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Paquete</th><th class="num">Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>' + st.d.orders.map(function (o) { return '<tr><td>' + o.id + '</td><td>' + e(o.package_name) + '</td><td class="num">' + S.money(o.amount) + '</td><td>' + K.tag(o.status) + '</td><td>' + e(ui.fmtDate(o.created_at)) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="hint">Aún no tienes pedidos.</p>') + '</div>';
  };

  V.soporte = function () {
    if (st.ticket) return '<div id="tk"><div class="skel"></div></div>';
    var ts = st.d.tickets;
    return head('Soporte', 'Escríbenos y te respondemos aquí mismo') + '<div class="grid-a ga-1-2"><div class="panel"><h2>Tus tickets</h2>' + (ts.length ? '<div class="list">' + ts.map(function (t) { return '<button class="item" data-tk="' + t.id + '" type="button" style="text-align:left;width:100%"><div class="grow"><h4>' + e(t.subject) + '</h4><small>' + e(ui.ago(t.updated_at)) + '</small></div>' + K.tag(t.status) + '</button>'; }).join('') + '</div>' : '<p class="hint">Todavía no has abierto tickets.</p>') + '</div>' +
      '<form class="panel" id="tkf" novalidate><h2>Nuevo ticket</h2><div class="form-grid"><div class="full">' + K.field('Asunto', 'subject', '', { req: 1, max: 120 }) + '</div><div class="full">' + K.field('¿En qué te ayudamos?', 'body', '', { type: 'textarea', req: 1, max: 3000, rows: 5 }) + '</div></div><p class="form-msg" id="tkm"></p><button class="btn btn-primary" type="submit"><span>Enviar</span></button><p class="hint" style="margin-top:10px">Para algo urgente, escríbenos por <a href="https://wa.me/525632960874" target="_blank" rel="noopener">WhatsApp</a>.</p></form></div>';
  };

  V.cuenta = function () {
    var u = st.d.user;
    return head('Cuenta', u.email) + '<div class="grid-a ga2"><form class="panel" id="prof" novalidate><h2>Tus datos</h2><div class="form-grid">' + K.field('Nombre', 'name', u.name, { req: 1, max: 80, ac: 'name' }) + K.field('Negocio', 'business', u.business, { max: 100, ac: 'organization' }) + K.field('Teléfono', 'phone', u.phone, { type: 'tel', max: 20, ac: 'tel', cls: 'full' }) + '</div><p class="form-msg" id="pm"></p><button class="btn btn-primary btn-sm" type="submit"><span>Guardar</span></button></form>' +
      '<form class="panel" id="pw" novalidate><h2>Cambiar contraseña</h2><div class="form-grid">' + K.field('Actual', 'current', '', { type: 'password', req: 1, ac: 'current-password', cls: 'full' }) + K.field('Nueva (mínimo 8)', 'password', '', { type: 'password', req: 1, ac: 'new-password', cls: 'full' }) + '</div><p class="form-msg" id="pwm"></p><button class="btn btn-dark btn-sm" type="submit"><span>Actualizar</span></button></form>' +
      '<form class="panel" id="claim" novalidate><h2>¿Ya eras cliente?</h2><p class="hint" style="margin-bottom:12px">Si te dimos un código de cuenta, escríbelo para ver tu información.</p>' + K.field('Código', 'code', '', { max: 20, ph: 'A1B2C3D4' }) + '<p class="form-msg" id="cm"></p><button class="btn btn-ghost btn-sm" type="submit"><span>Vincular</span></button></form>' +
      '<div class="panel"><h2>Sesión</h2><button class="btn btn-ghost btn-sm" id="logout" type="button"><span>Cerrar sesión</span></button></div></div>';
  };

  function head(t, sub, right) { return '<div class="bar"><div class="grow"><h1>' + t + '</h1><p class="sub">' + sub + '</p></div>' + (right || '') + '</div>'; }
  function empty(t, s) { return '<div class="panel"><div class="empty"><strong>' + e(t) + '</strong>' + e(s) + '</div></div>'; }

  /* ---------- shell ---------- */
  function shell() {
    var nav = NAV.map(function (n) { return '<button class="nv" data-v="' + n[0] + '" ' + (st.view === n[0] ? 'aria-current="page"' : '') + ' type="button">' + K.ic(n[2]) + '<span>' + n[1] + '</span></button>'; }).join('');
    var m = NAV.map(function (n) { return '<button data-v="' + n[0] + '" ' + (st.view === n[0] ? 'aria-current="page"' : '') + ' type="button">' + K.ic(n[2]) + '<span>' + (n[0] === 'pagos' ? 'Paquete' : n[1].split(' ')[0]) + '</span></button>'; }).join('');
    root.innerHTML = '<div class="app"><aside class="side"><a class="logo light" href="/"><span class="logo-mark" aria-hidden="true"><i></i></span><span>Línea Frontera</span></a><nav aria-label="Panel">' + nav + '</nav><div class="spacer"></div>' +
      (st.d.user.role === 'admin' ? '<a class="nv" href="/admin.html">' + K.ic('gear') + '<span>Ir al admin</span></a>' : '') + '<a class="nv" href="/">' + K.ic('globe') + '<span>Ver sitio</span></a><div class="who">' + e(st.d.user.email) + '</div></aside>' +
      '<main class="main" id="main"><div class="view" id="view"></div></main><nav class="mnav" aria-label="Panel">' + m + '</nav></div>';
    paint();
  }
  function paint() {
    var v = document.getElementById('view'); if (!v) return shell();
    Array.prototype.forEach.call(document.querySelectorAll('[data-v]'), function (b) { if (b.dataset.v === st.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    v.innerHTML = V[st.view](); K.bindCharts(v);
    if (st.view === 'soporte' && st.ticket) openTicket(st.ticket);
  }
  function go(view) { st.view = V[view] ? view : 'resumen'; st.ticket = null; if (location.hash !== '#' + st.view) history.replaceState(null, '', '#' + st.view); var v = document.getElementById('view'); v.style.animation = 'none'; void v.offsetWidth; v.style.animation = ''; paint(); window.scrollTo(0, 0); }

  function openTicket(id) {
    st.ticket = id;
    api.get('/tickets/' + id).then(function (r) {
      var box = document.getElementById('tk'); if (!box || !r.ok) return;
      box.innerHTML = '<div class="bar"><button class="btn btn-ghost btn-sm" data-back type="button"><span>← Tickets</span></button><div class="grow"><h1 style="font-size:1.5rem">' + e(r.data.ticket.subject) + '</h1></div>' + K.tag(r.data.ticket.status) + '</div><div class="panel"><div class="thread" id="thread">' + r.data.messages.map(function (m) { return '<div class="msg ' + (m.author_role === 'client' ? 'me' : '') + '"><small>' + e(m.author_role === 'client' ? 'Tú' : m.author_name || 'Línea Frontera') + ' · ' + e(ui.fmtDate(m.created_at, true)) + '</small>' + e(m.body) + '</div>'; }).join('') + '</div>' +
        '<form id="rep" style="margin-top:14px;display:grid;gap:10px">' + K.field('Responder', 'body', '', { type: 'textarea', req: 1, max: 3000, rows: 3 }) + '<button class="btn btn-primary btn-sm" type="submit" style="justify-self:start"><span>Enviar</span></button></form></div>';
      var th = document.getElementById('thread'); th.scrollTop = th.scrollHeight;
    });
  }

  function msgBox(id, ok, t) { var m = document.getElementById(id); if (m) { m.className = 'form-msg ' + (ok ? 'ok' : 'err'); m.textContent = t; } }
  function buy(pkgId, btn) {
    btn.disabled = true;
    api.post('/checkout', { packageId: pkgId }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) return ui.toast(api.errText(r));
      ui.track('checkout_started', { package: pkgId });
      if (r.data.url) { location.href = r.data.url; return; }
      var d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = '<div class="modal-in"><h3>Recibimos tu pedido #' + r.data.orderId + '</h3><p>Escríbenos por WhatsApp para confirmar tu pago (tarjeta o transferencia). Cuando se confirme, tu paquete se activa aquí.</p><a class="btn btn-primary block" target="_blank" rel="noopener" href="' + e(r.data.whatsapp) + '"><span>Confirmar por WhatsApp</span></a><button class="link-btn" type="button">Cerrar</button></div>';
      document.body.appendChild(d); d.querySelector('button').onclick = function () { d.close(); d.remove(); load(true).then(paint); }; d.showModal();
    });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-v],[data-appr],[data-buy],[data-tk],[data-back],#billing,#logout'); if (!t) return;
    if (t.dataset.v) return go(t.dataset.v);
    if (t.dataset.appr) { t.disabled = true; return api.post('/portal/content', { id: t.dataset.appr, status: t.dataset.s }).then(function (r) { if (!r.ok) ui.toast(api.errText(r)); else ui.toast(t.dataset.s === 'aprobado' ? 'Aprobado' : 'Avisamos al equipo'); return load(true).then(paint); }); }
    if (t.dataset.buy) return buy(t.dataset.buy, t);
    if (t.dataset.tk) { st.ticket = +t.dataset.tk; return paint(); }
    if (t.hasAttribute('data-back')) { st.ticket = null; return load(true).then(paint); }
    if (t.id === 'billing') return api.post('/billing-portal').then(function (r) { if (r.ok) location.href = r.data.url; else ui.toast(api.errText(r)); });
    if (t.id === 'logout') return api.post('/auth/logout').then(function () { location.href = '/'; });
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'range') { st.range = +ev.target.value; paint(); }
    if (ev.target.dataset && ev.target.dataset.task) api.post('/portal/task', { id: ev.target.dataset.task, done: ev.target.checked }).then(function () { load(true).then(paint); });
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target, id = f.id; if (!id) return; ev.preventDefault(); var d = {}; new FormData(f).forEach(function (v, k) { d[k] = v; });
    if (id === 'tkf') api.post('/tickets', d).then(function (r) { if (!r.ok) return msgBox('tkm', 0, api.errText(r)); ui.toast('Ticket enviado'); load(true).then(function () { st.ticket = r.data.id; paint(); }); });
    if (id === 'rep') api.post('/tickets/' + st.ticket + '/messages', d).then(function (r) { if (!r.ok) return ui.toast(api.errText(r)); openTicket(st.ticket); });
    if (id === 'prof') api.patch('/portal/profile', d).then(function (r) { msgBox('pm', r.ok, r.ok ? 'Guardado' : api.errText(r)); if (r.ok) load(true); });
    if (id === 'pw') api.post('/auth/change-password', d).then(function (r) { msgBox('pwm', r.ok, r.ok ? 'Contraseña actualizada' : api.errText(r)); if (r.ok) f.reset(); });
    if (id === 'claim') api.post('/portal/claim', d).then(function (r) { msgBox('cm', r.ok, r.ok ? 'Listo, cuenta vinculada' : api.errText(r)); if (r.ok) load(true).then(function () { go('resumen'); }); });
  });

  /* tiempo casi real: consulta cada 30 s si la pestaña está visible */
  function poll() {
    if (document.hidden || !st.d) return;
    var a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && document.getElementById('main').contains(a)) return;
    load(true).then(function (r) { if (r === 'changed') { paint(); ui.toast('Tus datos se actualizaron'); } });
  }
  setInterval(poll, 30000); document.addEventListener('visibilitychange', poll);

  api.ready().then(function () { ui.demoBanner(); return Promise.all([load(), api.get('/content')]); }).then(function (res) {
    if (!res[0]) return;
    st.content = S.resolveContent(res[1].data && res[1].data.content);
    var h = location.hash.slice(1); if (V[h]) st.view = h;
    shell();
    var q = new URLSearchParams(location.search); if (q.get('o')) ui.toast('Gracias. Estamos confirmando tu pago.');
  });
})(window);
