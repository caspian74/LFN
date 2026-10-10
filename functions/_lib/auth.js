import { now, randomHex, sha256hex, pbkdf2, safeEqual } from './util.js';

const COOKIE = 'lf_session';
const DAYS = 14;

export function parseCookies(req) {
  const out = {};
  (req.headers.get('cookie') || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

export function sessionCookie(req, value, maxAge) {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function hashPassword(password) {
  const salt = randomHex(16), iters = 100000;
  return { salt, iters, hash: await pbkdf2(password, salt, iters) };
}
export async function checkPassword(user, password) {
  return safeEqual(await pbkdf2(password, user.salt, user.iters), user.pass_hash);
}

export async function startSession(env, req, userId) {
  const token = randomHex(32);
  const id = await sha256hex(token);
  const created = now(), exp = new Date(Date.now() + DAYS * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?,?,?,?)').bind(id, userId, created, exp).run();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(created).run();
  return sessionCookie(req, token, DAYS * 86400);
}

export async function endSession(env, req) {
  const t = parseCookies(req)[COOKIE];
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256hex(t)).run();
  return sessionCookie(req, '', 0);
}

export async function currentUser(env, req) {
  const t = parseCookies(req)[COOKIE];
  if (!t || !/^[0-9a-f]{64}$/.test(t)) return null;
  const row = await env.DB.prepare(
    'SELECT u.id, u.email, u.name, u.business, u.phone, u.role, u.disabled FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?'
  ).bind(await sha256hex(t), now()).first();
  if (!row || row.disabled) return null;
  return row;
}

/** CSRF: toda petición que cambia estado debe traer X-LF y, si hay Origin, coincidir con el host. */
export function csrfOk(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  if (req.headers.get('x-lf') !== '1') return false;
  const origin = req.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== new URL(req.url).host) return false; } catch { return false; } }
  return true;
}
