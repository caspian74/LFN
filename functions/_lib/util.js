// Utilidades del backend (Cloudflare Workers / Node 22)
const enc = new TextEncoder();

export const now = () => new Date().toISOString();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
  });
}
export const fail = (status, error, extra = {}) => json({ ok: false, error, ...extra }, status);

export function hex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
export function unhex(h) { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
export function randomHex(bytes = 32) { return hex(crypto.getRandomValues(new Uint8Array(bytes))); }
export async function sha256hex(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }

export async function pbkdf2(password, saltHex, iters = 100000) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: iters }, key, 256);
  return hex(bits);
}

export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const getIp = (req) => req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

/** Devuelve true si se permite. Ventana deslizante guardada en D1. */
export async function rateLimit(env, key, limit, windowSec) {
  const t = Date.now();
  const k = await sha256hex(key);
  await env.DB.prepare('DELETE FROM rate_limits WHERE key = ? AND ts < ?').bind(k, t - windowSec * 1000).run();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE key = ?').bind(k).first();
  if (row.n >= limit) return false;
  await env.DB.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(k, t).run();
  return true;
}

export async function readJson(req, maxBytes = 64 * 1024) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) throw Object.assign(new Error('too_large'), { status: 413 });
  const text = await req.text();
  if (text.length > maxBytes) throw Object.assign(new Error('too_large'), { status: 413 });
  if (!text) return {};
  try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : {}; }
  catch { throw Object.assign(new Error('bad_json'), { status: 400 }); }
}

export const str = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
export const isEmail = (s) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(s) && s.length <= 254;
export const int = (v, def = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };

export async function audit(env, userId, action, detail = '') {
  try { await env.DB.prepare('INSERT INTO audit (user_id, action, detail, created_at) VALUES (?,?,?,?)').bind(userId ?? null, action, str(detail, 500), now()).run(); } catch { /* best-effort */ }
}

export async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token), remoteip: ip });
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}
