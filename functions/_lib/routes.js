import { add, json, fail } from './router.js';
import { now, str, isEmail, int, rateLimit, getIp, verifyTurnstile, randomHex, audit, safeEqual } from './util.js';
import { hashPassword, checkPassword, startSession, endSession } from './auth.js';
import { getContent, S } from './content.js';
import { stripeApi, verifyStripeSignature, markOrderPaid } from './stripe.js';

const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, business: u.business, phone: u.phone, role: u.role });
const clientOut = (c) => c && ({ id: c.id, name: c.name, business: c.business, email: c.email, phone: c.phone, plan: c.plan, status: c.status, updated_at: c.updated_at, billing: !!c.stripe_customer, data: S.sanitizeClientData(parse(c.data, {})) });

export async function clientFor(env, userId) {
  return env.DB.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY id LIMIT 1').bind(userId).first();
}
async function saveClientData(env, id, data) {
  await env.DB.prepare('UPDATE clients SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(S.sanitizeClientData(data)), now(), id).run();
}

// ---------- público ----------
add('GET', '/health', 'public', async ({ env }) => {
  const admin = await env.DB.prepare("SELECT 1 AS x FROM users WHERE role = 'admin' LIMIT 1").first();
  return json({ ok: true, stripe: !!env.STRIPE_SECRET_KEY, turnstile: env.TURNSTILE_SITEKEY || '', needsSetup: !admin && !!env.ADMIN_SETUP_TOKEN });
});

add('GET', '/content', 'public', async ({ env }) => {
  const { content, hash } = await getContent(env);
  return json({ ok: true, content, hash }, 200, { 'cache-control': 'public, max-age=15' });
});

add('POST', '/lead', 'public', async ({ req, env, body, waitUntil }) => {
  const b = await body();
  if (b.website) return json({ ok: true }); // honeypot
  const ip = getIp(req);
  if (!(await rateLimit(env, 'lead:' + ip, 6, 3600))) return fail(429, 'rate_limited');
  if (!(await verifyTurnstile(env, b.turnstile, ip))) return fail(400, 'captcha');
  const name = str(b.name, 80), business = str(b.business, 100), wa = S.normalizeWhatsApp(b.whatsapp);
  if (!name || !business) return fail(400, 'missing_fields');
  if (!wa) return fail(400, 'bad_whatsapp');
  if (b.consent !== true) return fail(400, 'consent_required');
  const utm = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'landing']) if (b.utm && b.utm[k]) utm[k] = str(b.utm[k], 120);
  const res = await env.DB.prepare('INSERT INTO leads (name, business, whatsapp, niche, message, utm, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(name, business, wa, str(b.niche, 80), str(b.message, 600), JSON.stringify(utm), now()).run();
  const text = `Nuevo lead: ${name} (${business}) WhatsApp ${wa}`;
  if (env.NOTIFY_WEBHOOK) waitUntil(fetch(env.NOTIFY_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, content: text }) }).catch(() => {}));
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) waitUntil(fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.RESEND_FROM || 'Línea Frontera <onboarding@resend.dev>', to: [env.NOTIFY_EMAIL], subject: 'Nuevo lead: ' + business, text: `${text}\nGiro: ${str(b.niche, 80)}\nMensaje: ${str(b.message, 600)}` }) }).catch(() => {}));
  return json({ ok: true, id: res.meta?.last_row_id ?? null }, 201);
});

// ---------- auth ----------
add('POST', '/auth/register', 'public', async ({ req, env, body }) => {
  const b = await body(), ip = getIp(req);
  if (!(await rateLimit(env, 'reg:' + ip, 6, 3600))) return fail(429, 'rate_limited');
  if (!(await verifyTurnstile(env, b.turnstile, ip))) return fail(400, 'captcha');
  const email = str(b.email, 254).toLowerCase(), name = str(b.name, 80), password = String(b.password || '');
  if (!isEmail(email)) return fail(400, 'bad_email');
  if (!name) return fail(400, 'missing_name');
  if (password.length < 8 || password.length > 100) return fail(400, 'weak_password');
  if (await env.DB.prepare('SELECT 1 AS x FROM users WHERE email = ?').bind(email).first()) return fail(409, 'email_taken');
  const h = await hashPassword(password), t = now();
  const u = await env.DB.prepare("INSERT INTO users (email, name, business, phone, role, pass_hash, salt, iters, created_at, last_login) VALUES (?,?,?,?, 'client', ?,?,?,?,?)")
    .bind(email, name, str(b.business, 100), str(b.phone, 20), h.hash, h.salt, h.iters, t, t).run();
  const uid = u.meta.last_row_id;
  await env.DB.prepare("INSERT INTO clients (user_id, name, business, email, phone, plan, status, data, created_at, updated_at) VALUES (?,?,?,?,?, '', 'onboarding', ?, ?, ?)")
    .bind(uid, name, str(b.business, 100), email, str(b.phone, 20), JSON.stringify(S.emptyClientData()), t, t).run();
  const cookie = await startSession(env, req, uid);
  const user = await env.DB.prepare('SELECT id, email, name, business, phone, role FROM users WHERE id = ?').bind(uid).first();
  return json({ ok: true, user: publicUser(user) }, 201, { 'set-cookie': cookie });
});

add('POST', '/auth/login', 'public', async ({ req, env, body }) => {
  const b = await body(), ip = getIp(req), email = str(b.email, 254).toLowerCase();
  if (!(await rateLimit(env, 'login:' + ip + ':' + email, 8, 900))) return fail(429, 'rate_limited');
  if (!(await verifyTurnstile(env, b.turnstile, ip))) return fail(400, 'captcha');
  const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  // siempre hacemos el hash para no filtrar si el correo existe por tiempos
  const ok = u ? await checkPassword(u, String(b.password || '')) : (await checkPassword({ salt: '00'.repeat(16), iters: 100000, pass_hash: 'x' }, String(b.password || '')), false);
  if (!u || !ok || u.disabled) return fail(401, 'bad_credentials');
  await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now(), u.id).run();
  return json({ ok: true, user: publicUser(u) }, 200, { 'set-cookie': await startSession(env, req, u.id) });
});

add('POST', '/auth/logout', 'public', async ({ req, env }) => json({ ok: true }, 200, { 'set-cookie': await endSession(env, req) }));

add('GET', '/me', 'optional', async ({ user }) => json({ ok: true, user: user ? publicUser(user) : null }));

add('POST', '/auth/setup-admin', 'public', async ({ req, env, body }) => {
  const b = await body(), ip = getIp(req);
  if (!(await rateLimit(env, 'setup:' + ip, 5, 3600))) return fail(429, 'rate_limited');
  if (!env.ADMIN_SETUP_TOKEN) return fail(404, 'not_found');
  if (await env.DB.prepare("SELECT 1 AS x FROM users WHERE role = 'admin' LIMIT 1").first()) return fail(403, 'already_setup');
  if (!safeEqual(String(b.token || ''), env.ADMIN_SETUP_TOKEN)) return fail(403, 'bad_token');
  const email = str(b.email, 254).toLowerCase(), password = String(b.password || '');
  if (!isEmail(email)) return fail(400, 'bad_email');
  if (password.length < 10) return fail(400, 'weak_password');
  const h = await hashPassword(password), t = now();
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  let uid;
  if (existing) { uid = existing.id; await env.DB.prepare("UPDATE users SET role = 'admin', pass_hash = ?, salt = ?, iters = ?, disabled = 0 WHERE id = ?").bind(h.hash, h.salt, h.iters, uid).run(); }
  else { uid = (await env.DB.prepare("INSERT INTO users (email, name, role, pass_hash, salt, iters, created_at, last_login) VALUES (?,?, 'admin', ?,?,?,?,?)").bind(email, str(b.name, 80) || 'Admin', h.hash, h.salt, h.iters, t, t).run()).meta.last_row_id; }
  await audit(env, uid, 'setup_admin', email);
  return json({ ok: true }, 201, { 'set-cookie': await startSession(env, req, uid) });
});

add('POST', '/auth/change-password', 'user', async ({ env, user, body, req }) => {
  const b = await body();
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  if (!(await checkPassword(u, String(b.current || '')))) return fail(403, 'bad_credentials');
  const np = String(b.password || '');
  if (np.length < 8 || np.length > 100) return fail(400, 'weak_password');
  const h = await hashPassword(np);
  await env.DB.prepare('UPDATE users SET pass_hash = ?, salt = ?, iters = ? WHERE id = ?').bind(h.hash, h.salt, h.iters, user.id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  return json({ ok: true }, 200, { 'set-cookie': await startSession(env, req, user.id) });
});

// ---------- portal del cliente ----------
add('GET', '/portal', 'user', async ({ env, user }) => {
  const c = await clientFor(env, user.id);
  const orders = (await env.DB.prepare('SELECT id, package_id, package_name, amount, currency, status, method, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50').bind(user.id).all()).results;
  const tickets = (await env.DB.prepare('SELECT id, subject, status, updated_at FROM tickets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50').bind(user.id).all()).results;
  return json({ ok: true, user: publicUser(user), client: clientOut(c), orders, tickets, serverTime: now() });
});

add('PATCH', '/portal/profile', 'user', async ({ env, user, body }) => {
  const b = await body();
  const name = str(b.name, 80) || user.name, business = str(b.business, 100), phone = str(b.phone, 20);
  await env.DB.prepare('UPDATE users SET name = ?, business = ?, phone = ? WHERE id = ?').bind(name, business, phone, user.id).run();
  await env.DB.prepare('UPDATE clients SET name = ?, business = ?, phone = ?, updated_at = ? WHERE user_id = ?').bind(name, business, phone, now(), user.id).run();
  return json({ ok: true });
});

add('POST', '/portal/content', 'user', async ({ env, user, body }) => {
  const b = await body(); const c = await clientFor(env, user.id);
  if (!c) return fail(404, 'no_client');
  const status = b.status === 'aprobado' ? 'aprobado' : b.status === 'cambios' ? 'cambios solicitados' : null;
  if (!status) return fail(400, 'bad_status');
  const data = parse(c.data, {}); const item = (data.content || []).find((x) => x.id === b.id);
  if (!item) return fail(404, 'not_found');
  item.status = status; await saveClientData(env, c.id, data);
  return json({ ok: true });
});

add('POST', '/portal/task', 'user', async ({ env, user, body }) => {
  const b = await body(); const c = await clientFor(env, user.id);
  if (!c) return fail(404, 'no_client');
  const data = parse(c.data, {}); const item = (data.tasks || []).find((x) => x.id === b.id);
  if (!item) return fail(404, 'not_found');
  item.done = !!b.done; await saveClientData(env, c.id, data);
  return json({ ok: true });
});

add('POST', '/portal/claim', 'user', async ({ env, user, req, body }) => {
  const b = await body();
  if (!(await rateLimit(env, 'claim:' + user.id, 8, 3600))) return fail(429, 'rate_limited');
  const code = str(b.code, 40).toUpperCase();
  if (code.length < 6) return fail(400, 'bad_code');
  const target = await env.DB.prepare('SELECT * FROM clients WHERE claim_code = ? AND user_id IS NULL').bind(code).first();
  if (!target) return fail(404, 'code_not_found');
  const mine = await clientFor(env, user.id);
  if (mine) {
    await env.DB.prepare('UPDATE orders SET client_id = ? WHERE client_id = ?').bind(target.id, mine.id).run();
    await env.DB.prepare('UPDATE tickets SET client_id = ? WHERE client_id = ?').bind(target.id, mine.id).run();
    await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(mine.id).run();
  }
  await env.DB.prepare('UPDATE clients SET user_id = ?, claim_code = NULL, updated_at = ? WHERE id = ?').bind(user.id, now(), target.id).run();
  await audit(env, user.id, 'claim_client', String(target.id));
  return json({ ok: true });
});

// ---------- tickets del cliente ----------
add('POST', '/tickets', 'user', async ({ env, user, body }) => {
  const b = await body(); const subject = str(b.subject, 120), text = str(b.body, 3000);
  if (!subject || !text) return fail(400, 'missing_fields');
  if (!(await rateLimit(env, 'tk:' + user.id, 12, 3600))) return fail(429, 'rate_limited');
  const c = await clientFor(env, user.id), t = now();
  const r = await env.DB.prepare("INSERT INTO tickets (user_id, client_id, subject, status, created_at, updated_at) VALUES (?,?,?, 'abierto', ?, ?)").bind(user.id, c?.id ?? null, subject, t, t).run();
  const id = r.meta.last_row_id;
  await env.DB.prepare('INSERT INTO ticket_messages (ticket_id, author_role, author_name, body, created_at) VALUES (?,?,?,?,?)').bind(id, 'client', user.name, text, t).run();
  return json({ ok: true, id }, 201);
});
add('GET', '/tickets/:id', 'user', async ({ env, user, params }) => {
  const t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?').bind(int(params.id), user.id).first();
  if (!t) return fail(404, 'not_found');
  const messages = (await env.DB.prepare('SELECT author_role, author_name, body, created_at FROM ticket_messages WHERE ticket_id = ? ORDER BY id').bind(t.id).all()).results;
  return json({ ok: true, ticket: t, messages });
});
add('POST', '/tickets/:id/messages', 'user', async ({ env, user, params, body }) => {
  const b = await body(); const text = str(b.body, 3000);
  const t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?').bind(int(params.id), user.id).first();
  if (!t) return fail(404, 'not_found');
  if (!text) return fail(400, 'missing_fields');
  if (!(await rateLimit(env, 'tkm:' + user.id, 30, 3600))) return fail(429, 'rate_limited');
  await env.DB.prepare('INSERT INTO ticket_messages (ticket_id, author_role, author_name, body, created_at) VALUES (?,?,?,?,?)').bind(t.id, 'client', user.name, text, now()).run();
  await env.DB.prepare("UPDATE tickets SET status = 'abierto', updated_at = ? WHERE id = ?").bind(now(), t.id).run();
  return json({ ok: true }, 201);
});

// ---------- compra ----------
add('POST', '/checkout', 'user', async ({ req, env, user, body }) => {
  const b = await body();
  if (!(await rateLimit(env, 'co:' + user.id, 15, 3600))) return fail(429, 'rate_limited');
  const { content } = await getContent(env);
  const pkg = content.packages.items.find((p) => p.id === String(b.packageId));
  if (!pkg) return fail(404, 'package_not_found');
  let c = await clientFor(env, user.id);
  if (!c) {
    const t = now();
    const r = await env.DB.prepare("INSERT INTO clients (user_id, name, business, email, phone, data, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(user.id, user.name, user.business, user.email, user.phone, JSON.stringify(S.emptyClientData()), t, t).run();
    c = { id: r.meta.last_row_id };
  }
  const origin = new URL(req.url).origin;
  const o = await env.DB.prepare("INSERT INTO orders (user_id, client_id, package_id, package_name, amount, currency, status, method, created_at) VALUES (?,?,?,?,?, 'MXN', 'pendiente', ?, ?)")
    .bind(user.id, c.id, pkg.id, pkg.name, Math.round(pkg.price), '', now()).run();
  const orderId = o.meta.last_row_id;
  if (env.STRIPE_SECRET_KEY && pkg.stripePriceId) {
    try {
      const s = await stripeApi(env, 'checkout/sessions', {
        mode: 'subscription', 'line_items[0][price]': pkg.stripePriceId, 'line_items[0][quantity]': 1,
        success_url: `${origin}/gracias.html?o=${orderId}`, cancel_url: `${origin}/#paquetes`,
        client_reference_id: orderId, customer_email: user.email, locale: 'es',
        'metadata[order_id]': orderId, 'metadata[package_id]': pkg.id, 'subscription_data[metadata][order_id]': orderId,
      });
      await env.DB.prepare("UPDATE orders SET method = 'stripe', stripe_session = ? WHERE id = ?").bind(s.id, orderId).run();
      return json({ ok: true, orderId, url: s.url });
    } catch (e) { console.error('stripe', e.message); return fail(502, 'payment_provider_error'); }
  }
  if (pkg.paymentLink && /^https:\/\//.test(pkg.paymentLink)) {
    const u = new URL(pkg.paymentLink); u.searchParams.set('client_reference_id', String(orderId)); u.searchParams.set('prefilled_email', user.email);
    await env.DB.prepare("UPDATE orders SET method = 'enlace' WHERE id = ?").bind(orderId).run();
    return json({ ok: true, orderId, url: u.toString() });
  }
  await env.DB.prepare("UPDATE orders SET method = 'manual' WHERE id = ?").bind(orderId).run();
  const msg = `Hola, quiero contratar el paquete ${pkg.name} (${S.money(pkg.price)} MXN/mes). Pedido #${orderId}.`;
  return json({ ok: true, orderId, manual: true, whatsapp: S.waLink(content.brand.whatsapp, msg), package: { name: pkg.name, price: pkg.price } });
});

add('POST', '/billing-portal', 'user', async ({ req, env, user }) => {
  if (!env.STRIPE_SECRET_KEY) return fail(501, 'stripe_not_configured');
  const c = await clientFor(env, user.id);
  if (!c?.stripe_customer) return fail(404, 'no_billing');
  try {
    const s = await stripeApi(env, 'billing_portal/sessions', { customer: c.stripe_customer, return_url: new URL(req.url).origin + '/dashboard.html' });
    return json({ ok: true, url: s.url });
  } catch { return fail(502, 'payment_provider_error'); }
});

add('POST', '/stripe/webhook', 'webhook', async ({ req, env }) => {
  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, req.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET))) return fail(400, 'bad_signature');
  let ev; try { ev = JSON.parse(raw); } catch { return fail(400, 'bad_json'); }
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object, orderId = int(s.metadata?.order_id || s.client_reference_id, 0);
    if (orderId && (s.payment_status === 'paid' || s.status === 'complete')) {
      await markOrderPaid(env, orderId, { session: s.id, customer: s.customer, method: 'stripe' });
      await audit(env, null, 'order_paid', String(orderId));
    }
  }
  return json({ ok: true });
});
