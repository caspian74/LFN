import { add, json, fail } from './router.js';
import { now, str, int, randomHex, audit } from './util.js';
import { hashPassword } from './auth.js';
import { getContent, saveContent, S } from './content.js';
import { markOrderPaid } from './stripe.js';

const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const LEAD_STATUS = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'ganado', 'perdido'];
const CLIENT_STATUS = ['onboarding', 'activo', 'pausado', 'cancelado'];
const TICKET_STATUS = ['abierto', 'en proceso', 'resuelto'];
const all = async (env, sql, ...binds) => (await env.DB.prepare(sql).bind(...binds).all()).results;

function csv(rows, cols, name) {
  return new Response(S.toCSV(rows, cols), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}

add('GET', '/admin/overview', 'admin', async ({ env }) => {
  const { content } = await getContent(env);
  const price = Object.fromEntries(content.packages.items.map((p) => [p.id, p.price]));
  const clients = await all(env, 'SELECT id, plan, status, data FROM clients');
  let mrr = 0, active = 0, spend = 0, leads30 = 0, sales30 = 0;
  for (const c of clients) {
    if (c.status === 'activo') { active++; mrr += price[c.plan] || 0; }
    const t = S.totals(S.sanitizeClientData(parse(c.data, {})));
    spend += t.spend; leads30 += t.leads; sales30 += t.sales;
  }
  const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const byDay = await all(env, 'SELECT substr(created_at,1,10) AS d, COUNT(*) AS n FROM leads WHERE substr(created_at,1,10) >= ? GROUP BY d', since);
  const map = Object.fromEntries(byDay.map((r) => [r.d, r.n]));
  const series = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10); return { d, n: map[d] || 0 }; });
  const one = async (sql, ...b) => (await env.DB.prepare(sql).bind(...b).first()).n;
  return json({ ok: true,
    counts: { users: await one('SELECT COUNT(*) AS n FROM users'), clients: clients.length, activeClients: active, leadsNew: await one("SELECT COUNT(*) AS n FROM leads WHERE status = 'nuevo'"), leadsTotal: await one('SELECT COUNT(*) AS n FROM leads'),
      ordersPending: await one("SELECT COUNT(*) AS n FROM orders WHERE status = 'pendiente'"), ticketsOpen: await one("SELECT COUNT(*) AS n FROM tickets WHERE status != 'resuelto'") },
    mrr, revenuePaid: await one("SELECT COALESCE(SUM(amount),0) AS n FROM orders WHERE status = 'pagado'"),
    clientsTotals: { spend, leads: leads30, sales: sales30 }, leadSeries: series,
    leadsByStatus: await all(env, 'SELECT status, COUNT(*) AS n FROM leads GROUP BY status'),
    recentLeads: await all(env, 'SELECT id, name, business, whatsapp, status, created_at FROM leads ORDER BY id DESC LIMIT 6'),
    recentOrders: await all(env, 'SELECT id, package_name, amount, status, created_at FROM orders ORDER BY id DESC LIMIT 6') });
});

// ----- clientes -----
add('GET', '/admin/clients', 'admin', async ({ env }) => {
  const rows = await all(env, 'SELECT c.id, c.user_id, c.name, c.business, c.email, c.phone, c.plan, c.status, c.claim_code, c.updated_at, c.created_at, c.data, u.email AS user_email, u.disabled FROM clients c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.id DESC LIMIT 500');
  return json({ ok: true, clients: rows.map(({ data, ...r }) => ({ ...r, totals: S.totals(S.sanitizeClientData(parse(data, {}))) })) });
});
add('GET', '/admin/clients/:id', 'admin', async ({ env, params }) => {
  const c = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(int(params.id)).first();
  if (!c) return fail(404, 'not_found');
  const orders = await all(env, 'SELECT id, package_name, amount, status, method, created_at, paid_at FROM orders WHERE client_id = ? ORDER BY id DESC', c.id);
  return json({ ok: true, client: { ...c, stripe_customer: !!c.stripe_customer, data: S.sanitizeClientData(parse(c.data, {})) }, orders });
});
add('PUT', '/admin/clients/:id', 'admin', async ({ env, params, body, user }) => {
  const b = await body(256 * 1024); const id = int(params.id);
  const c = await env.DB.prepare('SELECT id FROM clients WHERE id = ?').bind(id).first();
  if (!c) return fail(404, 'not_found');
  const status = CLIENT_STATUS.includes(b.status) ? b.status : 'onboarding';
  await env.DB.prepare('UPDATE clients SET name = ?, business = ?, email = ?, phone = ?, plan = ?, status = ?, data = ?, updated_at = ? WHERE id = ?')
    .bind(str(b.name, 80), str(b.business, 100), str(b.email, 254), str(b.phone, 20), str(b.plan, 40).replace(/[^a-z0-9_-]/gi, ''), status, JSON.stringify(S.sanitizeClientData(b.data)), now(), id).run();
  await audit(env, user.id, 'client_update', String(id));
  return json({ ok: true });
});
add('POST', '/admin/clients', 'admin', async ({ env, body, user }) => {
  const b = await body(); const name = str(b.name, 80), t = now();
  if (!name) return fail(400, 'missing_name');
  const code = randomHex(4).toUpperCase();
  const r = await env.DB.prepare("INSERT INTO clients (name, business, email, phone, plan, status, data, claim_code, created_at, updated_at) VALUES (?,?,?,?,?, 'onboarding', ?, ?, ?, ?)")
    .bind(name, str(b.business, 100), str(b.email, 254), str(b.phone, 20), str(b.plan, 40).replace(/[^a-z0-9_-]/gi, ''), JSON.stringify(b.example ? S.exampleClientData() : S.emptyClientData()), code, t, t).run();
  await audit(env, user.id, 'client_create', String(r.meta.last_row_id));
  return json({ ok: true, id: r.meta.last_row_id, claimCode: code }, 201);
});
add('POST', '/admin/clients/:id/claim-code', 'admin', async ({ env, params }) => {
  const code = randomHex(4).toUpperCase();
  await env.DB.prepare('UPDATE clients SET claim_code = ? WHERE id = ? AND user_id IS NULL').bind(code, int(params.id)).run();
  return json({ ok: true, claimCode: code });
});
add('DELETE', '/admin/clients/:id', 'admin', async ({ env, params, user }) => {
  await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(int(params.id)).run();
  await audit(env, user.id, 'client_delete', params.id);
  return json({ ok: true });
});

// ----- usuarios -----
add('GET', '/admin/users', 'admin', async ({ env }) =>
  json({ ok: true, users: await all(env, 'SELECT id, email, name, business, phone, role, disabled, created_at, last_login FROM users ORDER BY id DESC LIMIT 500') }));
add('PATCH', '/admin/users/:id', 'admin', async ({ env, params, body, user }) => {
  const b = await body(); const id = int(params.id);
  if (id === user.id && (b.role === 'client' || b.disabled)) return fail(400, 'cannot_demote_self');
  if (b.role === 'admin' || b.role === 'client') await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(b.role, id).run();
  if (typeof b.disabled === 'boolean') {
    await env.DB.prepare('UPDATE users SET disabled = ? WHERE id = ?').bind(b.disabled ? 1 : 0, id).run();
    if (b.disabled) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  }
  await audit(env, user.id, 'user_update', `${id} ${JSON.stringify({ role: b.role, disabled: b.disabled })}`);
  return json({ ok: true });
});
add('POST', '/admin/users/:id/password', 'admin', async ({ env, params, body, user }) => {
  const b = await body(); const pw = String(b.password || '');
  if (pw.length < 8 || pw.length > 100) return fail(400, 'weak_password');
  const h = await hashPassword(pw), id = int(params.id);
  await env.DB.prepare('UPDATE users SET pass_hash = ?, salt = ?, iters = ? WHERE id = ?').bind(h.hash, h.salt, h.iters, id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  await audit(env, user.id, 'user_password_reset', String(id));
  return json({ ok: true });
});

// ----- leads -----
add('GET', '/admin/leads', 'admin', async ({ env }) =>
  json({ ok: true, leads: (await all(env, 'SELECT * FROM leads ORDER BY id DESC LIMIT 1000')).map((l) => ({ ...l, utm: parse(l.utm, {}) })) }));
add('PATCH', '/admin/leads/:id', 'admin', async ({ env, params, body }) => {
  const b = await body(); const id = int(params.id);
  if (b.status !== undefined) {
    if (!LEAD_STATUS.includes(b.status)) return fail(400, 'bad_status');
    await env.DB.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(b.status, id).run();
  }
  if (b.notes !== undefined) await env.DB.prepare('UPDATE leads SET notes = ? WHERE id = ?').bind(str(b.notes, 2000), id).run();
  return json({ ok: true });
});
add('DELETE', '/admin/leads/:id', 'admin', async ({ env, params, user }) => {
  await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(int(params.id)).run();
  await audit(env, user.id, 'lead_delete', params.id);
  return json({ ok: true });
});
add('POST', '/admin/leads/:id/convert', 'admin', async ({ env, params, user }) => {
  const l = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(int(params.id)).first();
  if (!l) return fail(404, 'not_found');
  const t = now(), code = randomHex(4).toUpperCase();
  const r = await env.DB.prepare("INSERT INTO clients (name, business, phone, status, data, claim_code, created_at, updated_at) VALUES (?,?,?, 'onboarding', ?, ?, ?, ?)").bind(l.name, l.business, l.whatsapp, JSON.stringify(S.emptyClientData()), code, t, t).run();
  await env.DB.prepare("UPDATE leads SET status = 'ganado', client_id = ? WHERE id = ?").bind(r.meta.last_row_id, l.id).run();
  await audit(env, user.id, 'lead_convert', String(l.id));
  return json({ ok: true, clientId: r.meta.last_row_id, claimCode: code }, 201);
});

// ----- pedidos -----
add('GET', '/admin/orders', 'admin', async ({ env }) =>
  json({ ok: true, orders: await all(env, 'SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 500') }));
add('PATCH', '/admin/orders/:id', 'admin', async ({ env, params, body, user }) => {
  const b = await body(); const id = int(params.id);
  if (b.status === 'pagado') await markOrderPaid(env, id, { method: 'manual' });
  else if (b.status === 'cancelado' || b.status === 'pendiente') await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(b.status, id).run();
  else return fail(400, 'bad_status');
  await audit(env, user.id, 'order_' + b.status, String(id));
  return json({ ok: true });
});

// ----- tickets -----
add('GET', '/admin/tickets', 'admin', async ({ env }) =>
  json({ ok: true, tickets: await all(env, 'SELECT t.*, u.name AS user_name, u.email AS user_email FROM tickets t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.updated_at DESC LIMIT 500') }));
add('GET', '/admin/tickets/:id', 'admin', async ({ env, params }) => {
  const t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(int(params.id)).first();
  if (!t) return fail(404, 'not_found');
  return json({ ok: true, ticket: t, messages: await all(env, 'SELECT author_role, author_name, body, created_at FROM ticket_messages WHERE ticket_id = ? ORDER BY id', t.id) });
});
add('POST', '/admin/tickets/:id/reply', 'admin', async ({ env, params, body, user }) => {
  const b = await body(); const id = int(params.id), text = str(b.body, 3000);
  const t = await env.DB.prepare('SELECT id FROM tickets WHERE id = ?').bind(id).first();
  if (!t) return fail(404, 'not_found');
  if (text) await env.DB.prepare('INSERT INTO ticket_messages (ticket_id, author_role, author_name, body, created_at) VALUES (?,?,?,?,?)').bind(id, 'admin', user.name || 'Línea Frontera', text, now()).run();
  const status = TICKET_STATUS.includes(b.status) ? b.status : 'en proceso';
  await env.DB.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?').bind(status, now(), id).run();
  return json({ ok: true });
});

// ----- sitio (editor) -----
add('GET', '/admin/content', 'admin', async ({ env }) => json({ ok: true, ...(await getContent(env)) }));
add('PUT', '/admin/content', 'admin', async ({ env, body, user }) => {
  const b = await body(256 * 1024);
  if (!b.content || typeof b.content !== 'object') return fail(400, 'bad_content');
  const r = await saveContent(env, b.content, b.label || 'Cambio manual', user.email);
  await audit(env, user.id, 'content_save', r.hash);
  return json({ ok: true, ...r });
});
add('GET', '/admin/versions', 'admin', async ({ env }) =>
  json({ ok: true, versions: await all(env, 'SELECT id, label, author, created_at FROM content_versions ORDER BY id DESC LIMIT 50') }));
add('POST', '/admin/versions/:id/restore', 'admin', async ({ env, params, user }) => {
  const v = await env.DB.prepare('SELECT * FROM content_versions WHERE id = ?').bind(int(params.id)).first();
  if (!v) return fail(404, 'not_found');
  const r = await saveContent(env, parse(v.content, {}), 'Restaurado #' + v.id, user.email);
  await audit(env, user.id, 'content_restore', String(v.id));
  return json({ ok: true, ...r });
});

// ----- exportar / auditoría -----
add('GET', '/admin/export/:type', 'admin', async ({ env, params }) => {
  if (params.type === 'leads') return csv(await all(env, 'SELECT id, name, business, whatsapp, niche, message, status, utm, created_at FROM leads ORDER BY id'), ['id', 'name', 'business', 'whatsapp', 'niche', 'message', 'status', 'utm', 'created_at'], 'leads.csv');
  if (params.type === 'clients') return csv(await all(env, 'SELECT id, name, business, email, phone, plan, status, created_at FROM clients ORDER BY id'), ['id', 'name', 'business', 'email', 'phone', 'plan', 'status', 'created_at'], 'clientes.csv');
  if (params.type === 'orders') return csv(await all(env, 'SELECT id, package_name, amount, currency, status, method, created_at, paid_at FROM orders ORDER BY id'), ['id', 'package_name', 'amount', 'currency', 'status', 'method', 'created_at', 'paid_at'], 'pedidos.csv');
  return fail(404, 'not_found');
});
add('GET', '/admin/audit', 'admin', async ({ env }) =>
  json({ ok: true, audit: await all(env, 'SELECT a.id, a.action, a.detail, a.created_at, u.email FROM audit a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 100') }));
