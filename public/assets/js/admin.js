/* Panel de administración: núcleo, resumen, leads, pedidos, tickets, usuarios, herramientas y ajustes */
(function (g) {
  'use strict';
  var S = g.LF.shared, api = g.LF.api, ui = g.LF.ui, K = g.LF.kit, e = S.esc;
  var A = g.LF.admin = { views: {}, st: { view: 'resumen', cache: {}, user: null }, drawer: null };
  var st = A.st;

  var NAV = [['resumen', 'Resumen', 'home'], ['clientes', 'Clientes', 'users'], ['leads', 'Leads', 'inbox'], ['pedidos', 'Pedidos', 'card'], ['tickets', 'Tickets', 'help'], ['usuarios', 'Usuarios', 'user'], ['sitio', 'Sitio', 'globe'], ['herramientas', 'Herramientas', 'tool'], ['ajustes', 'Ajustes', 'gear']];
  var LEAD_ST = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'ganado', 'perdido'];
  A.LEAD_ST = LEAD_ST;

  A.head = function (t, sub, right) { return '<div class="bar"><div class="grow"><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>'; };
  A.empty = function (t, s) { return '<div class="empty"><strong>' + e(t) + '</strong>' + e(s || '') + '</div>'; };
  A.msg = function (r) { return api.errText(r); };
  A.pkgName = function (id) { var p = st.content && st.content.packages.items.filter(function (x) { return x.id === id; })[0]; return p ? p.name : (id || '—'); };
  A.fail = function (r) { ui.toast(api.errText(r)); };
  A.prompt = function (title, label, type, okText) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = '<form class="modal-in"><h3></h3>' + K.field(label, 'v', '', { type: type || 'text', req: 1, attrs: ' autofocus' }) + '<div class="row-btns"><button class="btn btn-ghost btn-sm" type="button" data-x><span>Cancelar</span></button><button class="btn btn-primary btn-sm" type="submit"><span>' + e(okText || 'Aceptar') + '</span></button></div></form>';
      d.querySelector('h3').textContent = title; document.body.appendChild(d);
      function end(v) { d.close(); setTimeout(function () { d.remove(); }, 300); resolve(v); }
      d.querySelector('[data-x]').onclick = function () { end(null); }; d.addEventListener('cancel', function (ev) { ev.preventDefault(); end(null); });
      d.querySelector('form').onsubmit = function (ev) { ev.preventDefault(); end(d.querySelector('input').value); }; d.showModal();
    });
  };
  A.reload = function () { return A.render(); };

  /* ---------- Resumen ---------- */
  A.views.resumen = function () {
    return api.get('/admin/overview').then(function (r) {
      if (!r.ok) return A.head('Resumen') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      var d = r.data, c = d.counts;
      var st2 = d.leadsByStatus.map(function (x) { return { l: x.status, v: x.n }; });
      return A.head('Resumen', 'Lo importante de tu agencia hoy', '<button class="btn btn-primary btn-sm" data-a="go" data-v="clientes" data-new type="button"><span>+ Nuevo cliente</span></button>') +
        '<div class="grid-a ga4">' + K.stat('Ingreso mensual recurrente', S.money(d.mrr), c.activeClients + ' clientes activos', 'var(--accent3)') + K.stat('Cobrado en total', S.money(d.revenuePaid), '', 'var(--accent2)') +
        K.stat('Leads nuevos', S.num(c.leadsNew), S.num(c.leadsTotal) + ' en total', 'var(--accent)') + K.stat('Pedidos por confirmar', S.num(c.ordersPending), '', 'var(--sun)') + '</div>' +
        '<div class="grid-a ga4" style="margin-top:16px">' + K.stat('Cuentas registradas', S.num(c.users), S.num(c.clients) + ' fichas de cliente') + K.stat('Tickets abiertos', S.num(c.ticketsOpen), '', 'var(--accent)') +
        K.stat('Leads de tus clientes', S.num(d.clientsTotals.leads), 'Ventas ' + S.num(d.clientsTotals.sales), 'var(--accent3)') + K.stat('Inversión en anuncios de clientes', S.money(d.clientsTotals.spend), '', 'var(--accent2)') + '</div>' +
        '<div class="grid-a ga-1-2" style="margin-top:16px"><div class="panel"><h2>Leads en los últimos 14 días</h2>' + K.bars(d.leadSeries.map(function (x) { return x.n; }), d.leadSeries.map(function (x) { return x.d; }), '#FF3B5C') + '</div><div class="panel"><h2>Embudo de leads</h2>' + K.donut(st2) + '</div></div>' +
        '<div class="grid-a ga2" style="margin-top:16px"><div class="panel"><h2>Últimos leads</h2>' + (d.recentLeads.length ? '<div class="list">' + d.recentLeads.map(function (l) { return '<button class="item" data-a="lead" data-id="' + l.id + '" type="button" style="text-align:left;width:100%"><div class="grow"><h4>' + e(l.business) + '</h4><small>' + e(l.name) + ' · ' + e(ui.ago(l.created_at)) + '</small></div>' + K.tag(l.status) + '</button>'; }).join('') + '</div>' : A.empty('Sin leads todavía', 'Cuando alguien llene el formulario aparecerá aquí.')) + '</div>' +
        '<div class="panel"><h2>Últimos pedidos</h2>' + (d.recentOrders.length ? '<div class="list">' + d.recentOrders.map(function (o) { return '<div class="item"><div class="grow"><h4>' + e(o.package_name) + '</h4><small>#' + o.id + ' · ' + e(ui.ago(o.created_at)) + '</small></div><b>' + S.money(o.amount) + '</b>' + K.tag(o.status) + '</div>'; }).join('') + '</div>' : A.empty('Sin pedidos todavía', 'Aquí verás las compras de paquetes.')) + '</div></div>';
    });
  };

  /* ---------- Leads ---------- */
  A.views.leads = function () {
    return api.get('/admin/leads').then(function (r) {
      if (!r.ok) return A.head('Leads') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      st.leads = r.data.leads; var q = (st.leadQ || '').toLowerCase();
      var list = st.leads.filter(function (l) { return !q || (l.name + ' ' + l.business + ' ' + l.whatsapp + ' ' + l.niche).toLowerCase().indexOf(q) > -1; });
      var by = {}; LEAD_ST.forEach(function (s) { by[s] = []; }); list.forEach(function (l) { (by[l.status] || by.nuevo).push(l); });
      return A.head('Leads', S.num(st.leads.length) + ' en total', '<button class="btn btn-ghost btn-sm" data-a="export" data-t="leads" type="button"><span>' + K.ic('download') + ' Exportar CSV</span></button>') +
        '<div class="tools"><input type="search" id="leadq" placeholder="Buscar por nombre, negocio, teléfono…" value="' + e(st.leadQ || '') + '" aria-label="Buscar leads"></div>' +
        (st.leads.length ? '<div class="kan">' + LEAD_ST.map(function (s) {
          return '<div class="kcol" data-drop="' + s + '"><h3><span>' + s + '</span><span>' + by[s].length + '</span></h3>' + by[s].map(function (l) {
            return '<div class="kcard" draggable="true" data-a="lead" data-id="' + l.id + '"><b>' + e(l.business) + '</b><span>' + e(l.name) + '</span><span class="hint">' + e(ui.ago(l.created_at)) + (l.utm && l.utm.utm_source ? ' · ' + e(l.utm.utm_source) : '') + '</span></div>';
          }).join('') + '</div>';
        }).join('') + '</div>' : '<div class="panel">' + A.empty('Aún no hay leads', 'El formulario de diagnóstico de tu sitio los enviará aquí.') + '</div>');
    });
  };
  A.views.leads.after = function (el) {
    var q = el.querySelector('#leadq'); if (q) q.addEventListener('input', ui.debounce(function () { st.leadQ = q.value; A.render(true); }, 200));
    var dragId = null;
    el.ondragstart = function (ev) { var c = ev.target.closest('.kcard'); if (!c) return; dragId = c.dataset.id; c.classList.add('drag'); ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', dragId); } catch (x) { /* noop */ } };
    el.ondragend = function (ev) { var c = ev.target.closest('.kcard'); if (c) c.classList.remove('drag'); Array.prototype.forEach.call(el.querySelectorAll('.over'), function (x) { x.classList.remove('over'); }); };
    el.ondragover = function (ev) { var col = ev.target.closest('.kcol'); if (col) { ev.preventDefault(); Array.prototype.forEach.call(el.querySelectorAll('.over'), function (x) { x.classList.remove('over'); }); col.classList.add('over'); } };
    el.ondrop = function (ev) { var col = ev.target.closest('.kcol'); if (!col || !dragId) return; ev.preventDefault(); api.patch('/admin/leads/' + dragId, { status: col.dataset.drop }).then(function (r) { if (!r.ok) A.fail(r); A.render(true); }); };
  };

  A.openLead = function (id) {
    var l = st.leads.filter(function (x) { return x.id === +id; })[0]; if (!l) return;
    var utm = l.utm || {}, ut = Object.keys(utm).map(function (k) { return '<span class="tag">' + e(k) + ': ' + e(utm[k]) + '</span>'; }).join(' ') || '<span class="hint">Sin datos de campaña</span>';
    A.drawer.requestClose = null;
    A.drawer.open('<div class="dr-head"><h2>' + e(l.business) + '</h2><button class="btn-icon" data-a="dclose" type="button" aria-label="Cerrar">' + K.ic('x') + '</button></div><div class="dr-body"><div class="grid-a">' +
      '<div class="panel flat"><b>' + e(l.name) + '</b><div class="hint">' + e(l.whatsapp) + (l.niche ? ' · ' + e(l.niche) : '') + ' · ' + e(ui.fmtDate(l.created_at, true)) + '</div>' + (l.message ? '<p style="margin-top:10px">' + e(l.message) + '</p>' : '') + '<div style="margin-top:12px">' + ut + '</div></div>' +
      '<div class="form-grid">' + K.field('Estado', 'status', l.status, { type: 'select', options: LEAD_ST }) + '<div></div>' + K.field('Notas internas', 'notes', l.notes, { type: 'textarea', rows: 5, max: 2000, cls: 'full' }) + '</div>' +
      '<div class="row-btns" style="justify-content:flex-start"><a class="btn btn-sm btn-primary" target="_blank" rel="noopener" href="' + e(S.waLink(l.whatsapp, 'Hola ' + l.name.split(' ')[0] + ', soy de Línea Frontera. Vi que pediste un diagnóstico para ' + l.business + '.')) + '"><span>' + K.ic('wa') + ' Escribir por WhatsApp</span></a>' + (l.client_id ? '<span class="tag ok">Ya es cliente</span>' : '<button class="btn btn-sm btn-dark" data-a="convert" data-id="' + l.id + '" type="button"><span>Convertir en cliente</span></button>') + '</div></div></div>' +
      '<div class="dr-foot"><button class="btn btn-sm danger" data-a="ldel" data-id="' + l.id + '" type="button"><span>Eliminar</span></button><button class="btn btn-sm btn-primary" data-a="lsave" data-id="' + l.id + '" type="button"><span>Guardar</span></button></div>');
  };

  /* ---------- Pedidos ---------- */
  A.views.pedidos = function () {
    return api.get('/admin/orders').then(function (r) {
      if (!r.ok) return A.head('Pedidos') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      var os = r.data.orders, paid = os.filter(function (o) { return o.status === 'pagado'; }), pend = os.filter(function (o) { return o.status === 'pendiente'; });
      return A.head('Pedidos', 'Compras de paquetes', '<button class="btn btn-ghost btn-sm" data-a="export" data-t="orders" type="button"><span>' + K.ic('download') + ' Exportar CSV</span></button>') +
        '<div class="grid-a ga3" style="margin-bottom:16px">' + K.stat('Cobrado', S.money(paid.reduce(function (a, o) { return a + o.amount; }, 0)), paid.length + ' pedidos', 'var(--accent3)') + K.stat('Por confirmar', S.money(pend.reduce(function (a, o) { return a + o.amount; }, 0)), pend.length + ' pedidos', 'var(--sun)') + K.stat('Pedidos totales', S.num(os.length)) + '</div>' +
        (os.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Cliente</th><th>Paquete</th><th class="num">Monto</th><th>Método</th><th>Estado</th><th>Fecha</th><th></th></tr></thead><tbody>' + os.map(function (o) {
          return '<tr><td>' + o.id + '</td><td>' + e(o.user_name || '—') + '<div class="hint">' + e(o.user_email || '') + '</div></td><td>' + e(o.package_name) + '</td><td class="num">' + S.money(o.amount) + '</td><td>' + e(o.method || '—') + '</td><td>' + K.tag(o.status) + '</td><td>' + e(ui.fmtDate(o.created_at)) + '</td><td style="white-space:nowrap">' +
            (o.status !== 'pagado' ? '<button class="btn btn-sm btn-primary" data-a="opay" data-id="' + o.id + '" type="button"><span>Marcar pagado</span></button> ' : '') + (o.status === 'pendiente' ? '<button class="btn-icon danger" data-a="ocancel" data-id="' + o.id + '" type="button" aria-label="Cancelar pedido">' + K.ic('x') + '</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="panel">' + A.empty('Sin pedidos', 'Cuando alguien contrate un paquete aparecerá aquí.') + '</div>');
    });
  };

  /* ---------- Tickets ---------- */
  A.views.tickets = function () {
    return api.get('/admin/tickets').then(function (r) {
      if (!r.ok) return A.head('Tickets') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      var ts = r.data.tickets; var f = st.tkF || 'abiertos'; var list = ts.filter(function (t) { return f === 'todos' || (f === 'abiertos' ? t.status !== 'resuelto' : t.status === 'resuelto'); });
      return A.head('Tickets', 'Soporte a clientes') + '<div class="tools"><select id="tkf" aria-label="Filtro">' + ['abiertos', 'resueltos', 'todos'].map(function (o) { return '<option' + (o === f ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
        (list.length ? '<div class="list">' + list.map(function (t) { return '<button class="item" data-a="ticket" data-id="' + t.id + '" type="button" style="text-align:left;width:100%"><div class="grow"><h4>' + e(t.subject) + '</h4><small>' + e(t.user_name || '') + ' · ' + e(t.user_email || '') + ' · ' + e(ui.ago(t.updated_at)) + '</small></div>' + K.tag(t.status) + '</button>'; }).join('') + '</div>' : '<div class="panel">' + A.empty('Nada por aquí', 'No hay tickets en este filtro.') + '</div>');
    });
  };
  A.views.tickets.after = function (el) { var s = el.querySelector('#tkf'); if (s) s.onchange = function () { st.tkF = s.value; A.render(true); }; };
  A.openTicket = function (id) {
    api.get('/admin/tickets/' + id).then(function (r) {
      if (!r.ok) return A.fail(r); var t = r.data.ticket; A.drawer.requestClose = null;
      A.drawer.open('<div class="dr-head"><h2>' + e(t.subject) + '</h2>' + K.tag(t.status) + '<button class="btn-icon" data-a="dclose" type="button" aria-label="Cerrar">' + K.ic('x') + '</button></div><div class="dr-body"><div class="thread" id="thread">' + r.data.messages.map(function (m) { return '<div class="msg ' + (m.author_role === 'admin' ? 'me' : '') + '"><small>' + e(m.author_name) + ' · ' + e(ui.fmtDate(m.created_at, true)) + '</small>' + e(m.body) + '</div>'; }).join('') + '</div>' +
        '<form id="trep" data-id="' + t.id + '" style="margin-top:14px;display:grid;gap:10px">' + K.field('Respuesta', 'body', '', { type: 'textarea', rows: 4, max: 3000 }) + K.field('Estado después de responder', 'status', 'en proceso', { type: 'select', options: ['abierto', 'en proceso', 'resuelto'] }) + '<button class="btn btn-primary btn-sm" type="submit" style="justify-self:start"><span>Enviar</span></button></form></div>');
      var th = document.getElementById('thread'); if (th) th.scrollTop = th.scrollHeight;
    });
  };

  /* ---------- Usuarios ---------- */
  A.views.usuarios = function () {
    return api.get('/admin/users').then(function (r) {
      if (!r.ok) return A.head('Usuarios') + '<div class="alert bad">' + e(A.msg(r)) + '</div>';
      return A.head('Usuarios', S.num(r.data.users.length) + ' cuentas registradas') + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead><tbody>' + r.data.users.map(function (u) {
        var me = u.id === st.user.id;
        return '<tr><td>' + e(u.name) + '<div class="hint">' + e(u.business || '') + '</div></td><td>' + e(u.email) + '</td><td>' + K.tag(u.role === 'admin' ? 'admin' : 'cliente') + '</td><td>' + e(u.last_login ? ui.fmtDate(u.last_login) : '—') + '</td><td>' + (u.disabled ? K.tag('cancelado') : K.tag('activo')) + '</td><td style="white-space:nowrap">' +
          (me ? '<span class="hint">Tú</span>' : '<button class="btn btn-sm btn-ghost" data-a="urole" data-id="' + u.id + '" data-r="' + (u.role === 'admin' ? 'client' : 'admin') + '" type="button"><span>' + (u.role === 'admin' ? 'Quitar admin' : 'Hacer admin') + '</span></button> <button class="btn btn-sm btn-ghost" data-a="udis" data-id="' + u.id + '" data-d="' + (u.disabled ? 0 : 1) + '" type="button"><span>' + (u.disabled ? 'Activar' : 'Desactivar') + '</span></button> ') + '<button class="btn btn-sm btn-ghost" data-a="upw" data-id="' + u.id + '" type="button"><span>Nueva clave</span></button></td></tr>';
      }).join('') + '</tbody></table></div>';
    });
  };

  /* ---------- Herramientas ---------- */
  A.views.herramientas = function () {
    var tpl = [['Primer contacto', 'Hola {nombre}, soy {tu nombre} de Línea Frontera. Vi que pediste un diagnóstico para {negocio}. ¿Te late que platiquemos 15 minutos hoy o mañana?'], ['Seguimiento', 'Hola {nombre}, ¿pudiste revisar lo que te mandé? Si quieres lo vemos en una llamada corta y te explico cómo lo haríamos para {negocio}.'], ['Propuesta enviada', 'Hola {nombre}, te dejo la propuesta para {negocio}. Cualquier duda me dices y la ajustamos. Con el paquete Crecimiento solemos arrancar en una semana.'], ['Bienvenida a cliente', 'Bienvenido a Línea Frontera, {nombre}. Ya está lista tu cuenta con panel. Entra a lineafrontera.stream, crea tu cuenta con este correo y te vinculamos tu información.']];
    var check = ['Acceso a Business Manager y página de Facebook', 'Acceso a la ficha de Google Business', 'Pixel de Meta y GA4 instalados', 'Brief de servicios y precios del cliente', 'Sesión de grabación agendada', 'Calendario del primer mes aprobado', 'Primera campaña lanzada', 'Panel del cliente con datos cargados'];
    var done = {}; try { done = JSON.parse(localStorage.getItem('lf_check') || '{}'); } catch (x) { /* noop */ }
    return A.head('Herramientas', 'Atajos para el día a día') + '<div class="grid-a ga2">' +
      '<form class="panel" id="t-utm" novalidate><h2>Creador de enlaces con UTM</h2><div class="form-grid">' + K.field('URL destino', 'u', 'https://lineafrontera.stream/', { cls: 'full' }) + K.field('Fuente', 's', 'instagram') + K.field('Medio', 'm', 'cpc') + K.field('Campaña', 'c', 'diagnostico-octubre', { cls: 'full' }) + '</div><div class="item" style="margin-top:12px"><code id="utm-out" style="overflow-wrap:anywhere;flex:1;background:none"></code><button class="btn-icon" type="button" data-a="copy" data-from="utm-out" aria-label="Copiar">' + K.ic('copy') + '</button></div></form>' +
      '<form class="panel" id="t-wa" novalidate><h2>Enlace de WhatsApp con mensaje</h2><div class="form-grid">' + K.field('Número', 'n', '5632960874', { type: 'tel' }) + '<div></div>' + K.field('Mensaje', 'm', 'Hola, quiero información.', { type: 'textarea', rows: 3, cls: 'full' }) + '</div><div class="item" style="margin-top:12px"><code id="wa-out" style="overflow-wrap:anywhere;flex:1;background:none"></code><button class="btn-icon" type="button" data-a="copy" data-from="wa-out" aria-label="Copiar">' + K.ic('copy') + '</button></div></form>' +
      '<form class="panel" id="t-roas" novalidate><h2>Calculadora rápida de anuncios</h2><div class="form-grid">' + K.field('Gasto', 'g', 5000, { type: 'number' }) + K.field('Leads', 'l', 80, { type: 'number' }) + K.field('Ventas', 'v', 20, { type: 'number' }) + K.field('Ingresos', 'r', 30000, { type: 'number' }) + '</div><div class="grid-a ga3" style="margin-top:12px" id="roas-out"></div></form>' +
      '<form class="panel" id="t-ad" novalidate><h2>Probador de textos de anuncio</h2>' + K.field('Texto principal Meta (ideal hasta 125)', 'p', '', { type: 'textarea', rows: 3 }) + '<div class="grid-a ga2" style="margin-top:10px">' + K.field('Título Google (máx. 30)', 'h', '') + K.field('Descripción Google (máx. 90)', 'd', '') + '</div><div class="hint" id="ad-out" style="margin-top:10px"></div></form>' +
      '<div class="panel"><h2>Plantillas de mensajes</h2><div class="list">' + tpl.map(function (t, i) { return '<div class="item"><div class="grow"><h4>' + e(t[0]) + '</h4><small>' + e(t[1]) + '</small></div><button class="btn-icon" type="button" data-a="copytxt" data-t="' + e(t[1]) + '" aria-label="Copiar ' + e(t[0]) + '">' + K.ic('copy') + '</button></div>'; }).join('') + '</div></div>' +
      '<div class="panel"><h2>Checklist de arranque con un cliente nuevo</h2>' + check.map(function (c, i) { return '<label class="check" style="margin:8px 0"><input type="checkbox" data-a="chk" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '><span>' + e(c) + '</span></label>'; }).join('') + '<p class="hint" style="margin-top:8px">Se guarda en este navegador.</p></div></div>';
  };
  A.views.herramientas.after = function (el) {
    var $ = function (s) { return el.querySelector(s); };
    function utm() { var f = $('#t-utm'), u = f.u.value.trim(), out = ''; try { var x = new URL(u); [['utm_source', f.s.value], ['utm_medium', f.m.value], ['utm_campaign', f.c.value]].forEach(function (p) { if (p[1]) x.searchParams.set(p[0], p[1].trim().toLowerCase().replace(/\s+/g, '-')); }); out = x.toString(); } catch (x) { out = 'Escribe una URL completa con https://'; } $('#utm-out').textContent = out; }
    function wa() { var f = $('#t-wa'); $('#wa-out').textContent = S.normalizeWhatsApp(f.n.value) ? S.waLink(f.n.value, f.m.value) : 'Revisa el número'; }
    function roas() { var f = $('#t-roas'), g1 = +f.g.value, l = +f.l.value, v = +f.v.value, r = +f.r.value; $('#roas-out').innerHTML = K.stat('Costo por lead', l ? S.money(g1 / l) : '—') + K.stat('Costo por venta', v ? S.money(g1 / v) : '—') + K.stat('Cierre', l ? S.pct(v / l * 100) : '—') + K.stat('ROAS', g1 ? (r / g1).toFixed(2) + 'x' : '—') + K.stat('Ticket promedio', v ? S.money(r / v) : '—') + K.stat('Utilidad bruta', S.money(r - g1)); }
    function ad() { var f = $('#t-ad'); function m(l, n, max) { return l + ': <b class="' + (n > max ? 'down' : 'up') + '">' + n + '/' + max + '</b>'; } $('#ad-out').innerHTML = m('Meta', f.p.value.length, 125) + ' · ' + m('Título', f.h.value.length, 30) + ' · ' + m('Descripción', f.d.value.length, 90); }
    ['#t-utm', '#t-wa', '#t-roas', '#t-ad'].forEach(function (s) { $(s).addEventListener('input', { '#t-utm': utm, '#t-wa': wa, '#t-roas': roas, '#t-ad': ad }[s]); $(s).addEventListener('submit', function (ev) { ev.preventDefault(); }); });
    utm(); wa(); roas(); ad();
  };

  /* ---------- Ajustes ---------- */
  A.views.ajustes = function () {
    var h = api.health() || {}, live = api.mode() === 'live';
    return Promise.all([live || api.mode() === 'demo' ? api.get('/admin/audit') : Promise.resolve({ ok: false })]).then(function (res) {
      var au = res[0].ok ? res[0].data.audit : [];
      return A.head('Ajustes', 'Estado del sistema, respaldos y auditoría') + '<div class="grid-a ga2"><div class="panel"><h2>Estado</h2><div class="list">' +
        row('Conexión', live ? K.tag('activo') + ' Cloudflare + D1' : K.tag('pausado') + ' Modo demo (navegador)') + row('Pagos con Stripe', h.stripe ? K.tag('activo') : K.tag('pendiente') + ' <span class="hint">Pedidos manuales por WhatsApp</span>') + row('Captcha Turnstile', h.turnstile ? K.tag('activo') : K.tag('pendiente')) + row('Sesión', e(st.user.email)) + '</div></div>' +
        '<div class="panel"><h2>Respaldos</h2><p class="hint" style="margin-bottom:12px">Descarga el contenido del sitio o tus listas en CSV.</p><div class="row-btns" style="justify-content:flex-start"><button class="btn btn-ghost btn-sm" data-a="bk" type="button"><span>' + K.ic('download') + ' Contenido del sitio (JSON)</span></button><button class="btn btn-ghost btn-sm" data-a="export" data-t="clients" type="button"><span>Clientes CSV</span></button><button class="btn btn-ghost btn-sm" data-a="export" data-t="leads" type="button"><span>Leads CSV</span></button><button class="btn btn-ghost btn-sm" data-a="export" data-t="orders" type="button"><span>Pedidos CSV</span></button></div></div></div>' +
        (api.mode() === 'demo' ? '<div class="panel" style="margin-top:16px"><h2>Modo demo</h2><p class="hint" style="margin-bottom:12px">Borra todos los datos de prueba guardados en este navegador.</p><button class="btn danger btn-sm" data-a="demoreset" type="button"><span>Borrar datos demo</span></button></div>' : '') +
        '<div class="panel" style="margin-top:16px"><h2>Registro de actividad</h2>' + (au.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Quién</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>' + au.map(function (a) { return '<tr><td>' + e(ui.fmtDate(a.created_at, true)) + '</td><td>' + e(a.email || 'sistema') + '</td><td><code>' + e(a.action) + '</code></td><td>' + e(a.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="hint">Aún sin actividad registrada.</p>') + '</div>';
    });
    function row(a, b) { return '<div class="item"><div class="grow"><h4>' + a + '</h4></div><div>' + b + '</div></div>'; }
  };

  /* ---------- shell + eventos ---------- */
  A.shell = function () {
    var root = document.getElementById('root'), nav = NAV.map(function (n) { return '<button class="nv" data-v="' + n[0] + '" type="button">' + K.ic(n[2]) + '<span>' + n[1] + '</span><span class="pip" hidden></span></button>'; }).join('');
    var m = NAV.map(function (n) { return '<button data-v="' + n[0] + '" type="button">' + K.ic(n[2]) + '<span>' + n[1] + '</span></button>'; }).join('');
    root.innerHTML = '<div class="app"><aside class="side"><a class="logo light" href="/"><span class="logo-mark" aria-hidden="true"><i></i></span><span>Admin</span></a><nav aria-label="Admin">' + nav + '</nav><div class="spacer"></div><a class="nv" href="/" target="_blank" rel="noopener">' + K.ic('eye') + '<span>Ver sitio</span></a><a class="nv" href="/dashboard.html">' + K.ic('user') + '<span>Mi vista de cliente</span></a><button class="nv" data-a="logout" type="button">' + K.ic('out') + '<span>Salir</span></button><div class="who">' + e(st.user.email) + '</div></aside><main class="main" id="main"><div class="view" id="view"></div></main><nav class="mnav" aria-label="Admin">' + m + '</nav></div>';
    A.drawer = K.Drawer();
  };
  A.render = function (keepScroll) {
    var v = document.getElementById('view'), name = st.view, y = window.scrollY;
    Array.prototype.forEach.call(document.querySelectorAll('[data-v]'), function (b) { if (b.dataset.v === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var f = A.views[name]; if (!f) return;
    if (!keepScroll) v.innerHTML = '<div class="skel" style="height:240px"></div>';
    return Promise.resolve(f()).then(function (html) {
      if (st.view !== name) return; v.innerHTML = html; K.bindCharts(v);
      if (f.after) f.after(v);
      if (keepScroll) window.scrollTo(0, y); else { v.style.animation = 'none'; void v.offsetWidth; v.style.animation = ''; }
    });
  };
  A.go = function (name) { if (A.drawer && A.drawer.isOpen()) A.drawer.close(); st.view = A.views[name] ? name : 'resumen'; if (location.hash !== '#' + st.view) history.replaceState(null, '', '#' + st.view); window.scrollTo(0, 0); return A.render(); };

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-v],[data-a]'); if (!t) return;
    if (t.dataset.v && !t.dataset.a) return A.go(t.dataset.v);
    var a = t.dataset.a, id = t.dataset.id;
    if (a === 'go') { A.go(t.dataset.v).then(function () { if (t.hasAttribute('data-new') && A.newClient) A.newClient(); }); return; }
    if (a === 'dclose') return (A.drawer.requestClose || A.drawer.close)();
    if (a === 'logout') return api.post('/auth/logout').then(function () { location.href = '/auth.html'; });
    if (a === 'lead') return A.openLead(id);
    if (a === 'lsave') { var d = A.drawer.el, body = { status: d.querySelector('[name=status]').value, notes: d.querySelector('[name=notes]').value }; return api.patch('/admin/leads/' + id, body).then(function (r) { if (!r.ok) return A.fail(r); ui.toast('Guardado'); A.drawer.close(); A.render(true); }); }
    if (a === 'ldel') return ui.confirm('¿Eliminar este lead?', 'No se puede deshacer.', 'Eliminar', true).then(function (ok) { if (ok) api.del('/admin/leads/' + id).then(function (r) { if (!r.ok) return A.fail(r); A.drawer.close(); A.render(true); }); });
    if (a === 'convert') return api.post('/admin/leads/' + id + '/convert').then(function (r) { if (!r.ok) return A.fail(r); A.drawer.close(); ui.toast('Cliente creado. Código de cuenta: ' + r.data.claimCode); A.go('clientes'); });
    if (a === 'export') return api.get('/admin/export/' + t.dataset.t).then(function (r) { if (r.ok) K.csvDownload(t.dataset.t + '.csv', typeof r.data === 'string' ? r.data : ''); else A.fail(r); });
    if (a === 'opay') return ui.confirm('¿Marcar como pagado?', 'Se activará el paquete del cliente.', 'Marcar pagado').then(function (ok) { if (ok) api.patch('/admin/orders/' + id, { status: 'pagado' }).then(function (r) { if (!r.ok) A.fail(r); A.render(true); }); });
    if (a === 'ocancel') return ui.confirm('¿Cancelar pedido?', '', 'Cancelar pedido', true).then(function (ok) { if (ok) api.patch('/admin/orders/' + id, { status: 'cancelado' }).then(function (r) { if (!r.ok) A.fail(r); A.render(true); }); });
    if (a === 'ticket') return A.openTicket(id);
    if (a === 'urole') return api.patch('/admin/users/' + id, { role: t.dataset.r }).then(function (r) { if (!r.ok) A.fail(r); A.render(true); });
    if (a === 'udis') return api.patch('/admin/users/' + id, { disabled: t.dataset.d === '1' }).then(function (r) { if (!r.ok) A.fail(r); A.render(true); });
    if (a === 'upw') return A.prompt('Nueva contraseña', 'Mínimo 8 caracteres', 'text', 'Cambiar').then(function (v) { if (v) api.post('/admin/users/' + id + '/password', { password: v }).then(function (r) { if (r.ok) ui.toast('Contraseña cambiada'); else A.fail(r); }); });
    if (a === 'copy') return K.copy(document.getElementById(t.dataset.from).textContent);
    if (a === 'copytxt') return K.copy(t.dataset.t);
    if (a === 'chk') { var o = {}; try { o = JSON.parse(localStorage.getItem('lf_check') || '{}'); } catch (x) { /* noop */ } o[t.dataset.i] = t.checked; try { localStorage.setItem('lf_check', JSON.stringify(o)); } catch (x) { /* noop */ } return; }
    if (a === 'bk') return api.get('/admin/content').then(function (r) { if (!r.ok) return A.fail(r); var b = new Blob([JSON.stringify(r.data.content, null, 2)], { type: 'application/json' }), l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'linea-frontera-sitio.json'; l.click(); setTimeout(function () { URL.revokeObjectURL(l.href); }, 500); });
    if (a === 'demoreset') return ui.confirm('¿Borrar datos demo?', 'Se perderán cuentas, leads y cambios guardados en este navegador.', 'Borrar', true).then(function (ok) { if (ok) { g.LF.demo.reset(); location.href = '/'; } });
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (f.id === 'trep') { ev.preventDefault(); api.post('/admin/tickets/' + f.dataset.id + '/reply', { body: f.body.value, status: f.status.value }).then(function (r) { if (!r.ok) return A.fail(r); ui.toast('Respuesta enviada'); A.drawer.close(); A.render(true); }); }
  });
})(window);
