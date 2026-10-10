/* Modo demo: imita la API con localStorage para ver el sitio sin servidor (o desde un archivo local).
   Los datos viven solo en este navegador. En producción se usa Cloudflare D1. */
(function (g) {
  'use strict';
  var S = g.LF.shared, KEY = 'lf_demo_db_v1';
  var mem = null;

  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; }
    if (!mem || !mem.users) mem = { users: [], clients: [], leads: [], orders: [], tickets: [], msgs: [], content: null, versions: [], audit: [], session: null, seq: 0 };
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* lleno o bloqueado */ } }
  function id(db) { db.seq += 1; return db.seq; }
  function now() { return new Date().toISOString(); }
  function res(status, data, headers) { return { status: status, ok: status < 400, data: data, headers: headers }; }
  function err(status, e) { return res(status, { ok: false, error: e }); }
  function sha(s) {
    var b = new TextEncoder().encode(s);
    return crypto.subtle.digest('SHA-256', b).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  function pubUser(u) { return { id: u.id, email: u.email, name: u.name, business: u.business, phone: u.phone, role: u.role }; }
  function me(db) { return db.users.filter(function (u) { return u.id === db.session && !u.disabled; })[0] || null; }
  function content(db) { return S.resolveContent(db.content || {}); }
  function clientOf(db, uid) { return db.clients.filter(function (c) { return c.user_id === uid; })[0]; }
  function cOut(c) { return c && { id: c.id, name: c.name, business: c.business, email: c.email, phone: c.phone, plan: c.plan, status: c.status, updated_at: c.updated_at, billing: false, data: S.sanitizeClientData(c.data) }; }
  function newClient(db, o) { var t = now(); var c = { id: id(db), user_id: o.user_id || null, name: o.name || '', business: o.business || '', email: o.email || '', phone: o.phone || '', plan: o.plan || '', status: 'onboarding', data: o.data || S.emptyClientData(), claim_code: o.claim_code || null, created_at: t, updated_at: t }; db.clients.push(c); return c; }
  function str(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }

  function handle(method, path, body) {
    var db = load(), b = body || {}, u = me(db), m, q = path.split('?')[0];
    function need() { return u ? null : err(401, 'no_session'); }
    function needAdmin() { return !u ? err(401, 'no_session') : u.role !== 'admin' ? err(403, 'forbidden') : null; }
    var done = Promise.resolve();
    var r = (function () {
      if (method === 'GET' && q === '/health') return res(200, { ok: true, demo: true, stripe: false, turnstile: '', needsSetup: false });
      if (method === 'GET' && q === '/content') return res(200, { ok: true, content: content(db), hash: S.contentHash(content(db)) });
      if (method === 'GET' && q === '/me') return res(200, { ok: true, user: u ? pubUser(u) : null });
      if (method === 'POST' && q === '/lead') {
        if (b.website) return res(200, { ok: true });
        var wa = S.normalizeWhatsApp(b.whatsapp);
        if (!str(b.name, 80) || !str(b.business, 100)) return err(400, 'missing_fields');
        if (!wa) return err(400, 'bad_whatsapp');
        if (b.consent !== true) return err(400, 'consent_required');
        db.leads.push({ id: id(db), name: str(b.name, 80), business: str(b.business, 100), whatsapp: wa, niche: str(b.niche, 80), message: str(b.message, 600), status: 'nuevo', notes: '', utm: b.utm || {}, created_at: now() });
        save(); return res(201, { ok: true });
      }
      if (method === 'POST' && q === '/auth/logout') { db.session = null; save(); return res(200, { ok: true }); }
      if (method === 'GET' && q === '/portal') {
        if (need()) return need();
        return res(200, { ok: true, user: pubUser(u), client: cOut(clientOf(db, u.id)), serverTime: now(),
          orders: db.orders.filter(function (o) { return o.user_id === u.id; }).reverse(), tickets: db.tickets.filter(function (t) { return t.user_id === u.id; }).reverse() });
      }
      if (method === 'PATCH' && q === '/portal/profile') { if (need()) return need(); u.name = str(b.name, 80) || u.name; u.business = str(b.business, 100); u.phone = str(b.phone, 20); var c0 = clientOf(db, u.id); if (c0) { c0.name = u.name; c0.business = u.business; c0.phone = u.phone; } save(); return res(200, { ok: true }); }
      if (method === 'POST' && (q === '/portal/content' || q === '/portal/task')) {
        if (need()) return need();
        var c1 = clientOf(db, u.id); if (!c1) return err(404, 'no_client');
        var list = q === '/portal/task' ? c1.data.tasks : c1.data.content, it = list.filter(function (x) { return x.id === b.id; })[0];
        if (!it) return err(404, 'not_found');
        if (q === '/portal/task') it.done = !!b.done; else it.status = b.status === 'aprobado' ? 'aprobado' : 'cambios solicitados';
        save(); return res(200, { ok: true });
      }
      if (method === 'POST' && q === '/portal/claim') {
        if (need()) return need();
        var tgt = db.clients.filter(function (c) { return c.claim_code && c.claim_code === str(b.code, 40).toUpperCase() && !c.user_id; })[0];
        if (!tgt) return err(404, 'code_not_found');
        var mine = clientOf(db, u.id); if (mine) db.clients.splice(db.clients.indexOf(mine), 1);
        tgt.user_id = u.id; tgt.claim_code = null; save(); return res(200, { ok: true });
      }
      if (method === 'POST' && q === '/tickets') {
        if (need()) return need();
        if (!str(b.subject, 120) || !str(b.body, 3000)) return err(400, 'missing_fields');
        var tk = { id: id(db), user_id: u.id, subject: str(b.subject, 120), status: 'abierto', created_at: now(), updated_at: now() };
        db.tickets.push(tk); db.msgs.push({ ticket_id: tk.id, author_role: 'client', author_name: u.name, body: str(b.body, 3000), created_at: now() }); save(); return res(201, { ok: true, id: tk.id });
      }
      if ((m = /^\/(admin\/)?tickets\/(\d+)$/.exec(q)) && method === 'GET') {
        if (m[1]) { if (needAdmin()) return needAdmin(); } else if (need()) return need();
        var t2 = db.tickets.filter(function (t) { return t.id === +m[2] && (m[1] || t.user_id === u.id); })[0]; if (!t2) return err(404, 'not_found');
        return res(200, { ok: true, ticket: t2, messages: db.msgs.filter(function (x) { return x.ticket_id === t2.id; }) });
      }
      if ((m = /^\/tickets\/(\d+)\/messages$/.exec(q)) && method === 'POST') {
        if (need()) return need();
        var t3 = db.tickets.filter(function (t) { return t.id === +m[1] && t.user_id === u.id; })[0]; if (!t3) return err(404, 'not_found');
        if (!str(b.body, 3000)) return err(400, 'missing_fields');
        db.msgs.push({ ticket_id: t3.id, author_role: 'client', author_name: u.name, body: str(b.body, 3000), created_at: now() }); t3.status = 'abierto'; t3.updated_at = now(); save(); return res(201, { ok: true });
      }
      if (method === 'POST' && q === '/checkout') {
        if (need()) return need();
        var pkg = content(db).packages.items.filter(function (p) { return p.id === String(b.packageId); })[0]; if (!pkg) return err(404, 'package_not_found');
        var c2 = clientOf(db, u.id) || newClient(db, { user_id: u.id, name: u.name, business: u.business, email: u.email });
        var o = { id: id(db), user_id: u.id, client_id: c2.id, package_id: pkg.id, package_name: pkg.name, amount: Math.round(pkg.price), currency: 'MXN', status: 'pendiente', method: 'manual', created_at: now(), paid_at: null };
        db.orders.push(o); save();
        return res(200, { ok: true, orderId: o.id, manual: true, whatsapp: S.waLink(content(db).brand.whatsapp, 'Hola, quiero contratar el paquete ' + pkg.name + ' (' + S.money(pkg.price) + ' MXN/mes). Pedido #' + o.id + '.'), package: { name: pkg.name, price: pkg.price } });
      }
      if (method === 'POST' && q === '/billing-portal') return err(501, 'stripe_not_configured');
      if (method === 'POST' && q === '/auth/setup-admin') return err(404, 'not_found');
      if (method === 'POST' && q === '/auth/change-password') return null;
      /* ---- admin ---- */
      if (q.indexOf('/admin/') === 0) {
        if (needAdmin()) return needAdmin();
        if (method === 'GET' && q === '/admin/overview') {
          var price = {}; content(db).packages.items.forEach(function (p) { price[p.id] = p.price; });
          var mrr = 0, act = 0, tot = { spend: 0, leads: 0, sales: 0 };
          db.clients.forEach(function (c) { if (c.status === 'activo') { act++; mrr += price[c.plan] || 0; } var t = S.totals(c.data); tot.spend += t.spend; tot.leads += t.leads; tot.sales += t.sales; });
          var ser = []; for (var i = 13; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); ser.push({ d: d, n: db.leads.filter(function (l) { return l.created_at.slice(0, 10) === d; }).length }); }
          var by = {}; db.leads.forEach(function (l) { by[l.status] = (by[l.status] || 0) + 1; });
          return res(200, { ok: true, counts: { users: db.users.length, clients: db.clients.length, activeClients: act, leadsNew: db.leads.filter(function (l) { return l.status === 'nuevo'; }).length, leadsTotal: db.leads.length, ordersPending: db.orders.filter(function (o) { return o.status === 'pendiente'; }).length, ticketsOpen: db.tickets.filter(function (t) { return t.status !== 'resuelto'; }).length },
            mrr: mrr, revenuePaid: db.orders.filter(function (o) { return o.status === 'pagado'; }).reduce(function (a, o) { return a + o.amount; }, 0), clientsTotals: tot, leadSeries: ser,
            leadsByStatus: Object.keys(by).map(function (k) { return { status: k, n: by[k] }; }), recentLeads: db.leads.slice(-6).reverse(), recentOrders: db.orders.slice(-6).reverse() });
        }
        if (method === 'GET' && q === '/admin/clients') return res(200, { ok: true, clients: db.clients.slice().reverse().map(function (c) { var uu = db.users.filter(function (x) { return x.id === c.user_id; })[0]; return { id: c.id, user_id: c.user_id, name: c.name, business: c.business, email: c.email, phone: c.phone, plan: c.plan, status: c.status, claim_code: c.claim_code, updated_at: c.updated_at, created_at: c.created_at, user_email: uu && uu.email, disabled: uu && uu.disabled ? 1 : 0, totals: S.totals(c.data) }; }) });
        if (method === 'POST' && q === '/admin/clients') { if (!str(b.name, 80)) return err(400, 'missing_name'); var code = Math.random().toString(16).slice(2, 10).toUpperCase(); var nc = newClient(db, { name: str(b.name, 80), business: str(b.business, 100), email: str(b.email, 254), phone: str(b.phone, 20), plan: str(b.plan, 40), claim_code: code, data: b.example ? S.exampleClientData() : S.emptyClientData() }); save(); return res(201, { ok: true, id: nc.id, claimCode: code }); }
        if ((m = /^\/admin\/clients\/(\d+)$/.exec(q))) {
          var c3 = db.clients.filter(function (c) { return c.id === +m[1]; })[0]; if (!c3) return err(404, 'not_found');
          if (method === 'GET') return res(200, { ok: true, client: Object.assign({}, c3, { data: S.sanitizeClientData(c3.data) }), orders: db.orders.filter(function (o) { return o.client_id === c3.id; }).reverse() });
          if (method === 'PUT') { c3.name = str(b.name, 80); c3.business = str(b.business, 100); c3.email = str(b.email, 254); c3.phone = str(b.phone, 20); c3.plan = str(b.plan, 40).replace(/[^a-z0-9_-]/gi, ''); c3.status = ['onboarding', 'activo', 'pausado', 'cancelado'].indexOf(b.status) > -1 ? b.status : 'onboarding'; c3.data = S.sanitizeClientData(b.data); c3.updated_at = now(); save(); return res(200, { ok: true }); }
          if (method === 'DELETE') { db.clients.splice(db.clients.indexOf(c3), 1); save(); return res(200, { ok: true }); }
        }
        if (method === 'GET' && q === '/admin/users') return res(200, { ok: true, users: db.users.map(function (x) { return Object.assign(pubUser(x), { disabled: x.disabled ? 1 : 0, created_at: x.created_at, last_login: x.last_login }); }).reverse() });
        if ((m = /^\/admin\/users\/(\d+)$/.exec(q)) && method === 'PATCH') { var u2 = db.users.filter(function (x) { return x.id === +m[1]; })[0]; if (!u2) return err(404, 'not_found'); if (u2.id === u.id && (b.role === 'client' || b.disabled)) return err(400, 'cannot_demote_self'); if (b.role === 'admin' || b.role === 'client') u2.role = b.role; if (typeof b.disabled === 'boolean') u2.disabled = b.disabled; save(); return res(200, { ok: true }); }
        if (method === 'GET' && q === '/admin/leads') return res(200, { ok: true, leads: db.leads.slice().reverse() });
        if ((m = /^\/admin\/leads\/(\d+)(\/convert)?$/.exec(q))) {
          var l = db.leads.filter(function (x) { return x.id === +m[1]; })[0]; if (!l) return err(404, 'not_found');
          if (method === 'PATCH') { if (b.status !== undefined) l.status = b.status; if (b.notes !== undefined) l.notes = str(b.notes, 2000); save(); return res(200, { ok: true }); }
          if (method === 'DELETE') { db.leads.splice(db.leads.indexOf(l), 1); save(); return res(200, { ok: true }); }
          if (method === 'POST' && m[2]) { var cd = Math.random().toString(16).slice(2, 10).toUpperCase(); var cc = newClient(db, { name: l.name, business: l.business, phone: l.whatsapp, claim_code: cd }); l.status = 'ganado'; l.client_id = cc.id; save(); return res(201, { ok: true, clientId: cc.id, claimCode: cd }); }
        }
        if (method === 'GET' && q === '/admin/orders') return res(200, { ok: true, orders: db.orders.slice().reverse().map(function (o) { var uu = db.users.filter(function (x) { return x.id === o.user_id; })[0]; return Object.assign({}, o, { user_email: uu && uu.email, user_name: uu && uu.name }); }) });
        if ((m = /^\/admin\/orders\/(\d+)$/.exec(q)) && method === 'PATCH') { var o2 = db.orders.filter(function (x) { return x.id === +m[1]; })[0]; if (!o2) return err(404, 'not_found'); o2.status = b.status; if (b.status === 'pagado') { o2.paid_at = now(); var c4 = db.clients.filter(function (c) { return c.id === o2.client_id; })[0]; if (c4) { c4.plan = o2.package_id; c4.status = 'activo'; } } save(); return res(200, { ok: true }); }
        if (method === 'GET' && q === '/admin/tickets') return res(200, { ok: true, tickets: db.tickets.slice().reverse().map(function (t) { var uu = db.users.filter(function (x) { return x.id === t.user_id; })[0]; return Object.assign({}, t, { user_name: uu && uu.name, user_email: uu && uu.email }); }) });
        if ((m = /^\/admin\/tickets\/(\d+)\/reply$/.exec(q)) && method === 'POST') { var t4 = db.tickets.filter(function (t) { return t.id === +m[1]; })[0]; if (!t4) return err(404, 'not_found'); if (str(b.body, 3000)) db.msgs.push({ ticket_id: t4.id, author_role: 'admin', author_name: u.name, body: str(b.body, 3000), created_at: now() }); t4.status = ['abierto', 'en proceso', 'resuelto'].indexOf(b.status) > -1 ? b.status : 'en proceso'; t4.updated_at = now(); save(); return res(200, { ok: true }); }
        if (method === 'GET' && q === '/admin/content') return res(200, { ok: true, content: content(db), hash: S.contentHash(content(db)) });
        if (method === 'PUT' && q === '/admin/content') { var nc2 = S.sanitizeContent(b.content); db.content = nc2; db.versions.push({ id: id(db), label: str(b.label, 80) || 'Cambio manual', author: u.email, created_at: now(), content: nc2 }); db.versions = db.versions.slice(-30); save(); return res(200, { ok: true, content: nc2, hash: S.contentHash(nc2) }); }
        if (method === 'GET' && q === '/admin/versions') return res(200, { ok: true, versions: db.versions.slice().reverse().map(function (v) { return { id: v.id, label: v.label, author: v.author, created_at: v.created_at }; }) });
        if ((m = /^\/admin\/versions\/(\d+)\/restore$/.exec(q)) && method === 'POST') { var v = db.versions.filter(function (x) { return x.id === +m[1]; })[0]; if (!v) return err(404, 'not_found'); db.content = S.sanitizeContent(v.content); db.versions.push({ id: id(db), label: 'Restaurado #' + v.id, author: u.email, created_at: now(), content: db.content }); save(); return res(200, { ok: true, content: db.content, hash: S.contentHash(db.content) }); }
        if ((m = /^\/admin\/export\/(leads|clients|orders)$/.exec(q))) { var cols = { leads: ['id', 'name', 'business', 'whatsapp', 'niche', 'message', 'status', 'created_at'], clients: ['id', 'name', 'business', 'email', 'phone', 'plan', 'status', 'created_at'], orders: ['id', 'package_name', 'amount', 'currency', 'status', 'method', 'created_at', 'paid_at'] }[m[1]]; return res(200, S.toCSV(db[m[1]], cols)); }
        if (method === 'GET' && q === '/admin/audit') return res(200, { ok: true, audit: db.audit });
        return err(404, 'not_found');
      }
      return undefined;
    })();
    if (r !== undefined && r !== null) return Promise.resolve(r);
    /* rutas asíncronas (hash de contraseñas) */
    return done.then(function () {
      if (method === 'POST' && q === '/auth/register') {
        var email = str(b.email, 254).toLowerCase(), pw = String(b.password || '');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err(400, 'bad_email');
        if (!str(b.name, 80)) return err(400, 'missing_name');
        if (pw.length < 8) return err(400, 'weak_password');
        if (db.users.some(function (x) { return x.email === email; })) return err(409, 'email_taken');
        var salt = Math.random().toString(36).slice(2);
        return sha(salt + pw).then(function (h) {
          var first = db.users.length === 0, nu = { id: id(db), email: email, name: str(b.name, 80), business: str(b.business, 100), phone: str(b.phone, 20), role: first ? 'admin' : 'client', salt: salt, hash: h, disabled: false, created_at: now(), last_login: now() };
          db.users.push(nu); if (!first) newClient(db, { user_id: nu.id, name: nu.name, business: nu.business, email: nu.email, phone: nu.phone }); db.session = nu.id; save();
          return res(201, { ok: true, user: pubUser(nu), demoAdmin: first });
        });
      }
      if (method === 'POST' && q === '/auth/login') {
        var u3 = db.users.filter(function (x) { return x.email === str(b.email, 254).toLowerCase(); })[0];
        if (!u3 || u3.disabled) return err(401, 'bad_credentials');
        return sha(u3.salt + String(b.password || '')).then(function (h) { if (h !== u3.hash) return err(401, 'bad_credentials'); db.session = u3.id; u3.last_login = now(); save(); return res(200, { ok: true, user: pubUser(u3) }); });
      }
      if (method === 'POST' && q === '/auth/change-password') {
        if (!u) return err(401, 'no_session');
        return sha(u.salt + String(b.current || '')).then(function (h) { if (h !== u.hash) return err(403, 'bad_credentials'); if (String(b.password || '').length < 8) return err(400, 'weak_password'); return sha(u.salt + b.password).then(function (n) { u.hash = n; save(); return res(200, { ok: true }); }); });
      }
      return err(404, 'not_found');
    });
  }

  g.LF.demo = { handle: handle, reset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } mem = null; } };
})(window);
