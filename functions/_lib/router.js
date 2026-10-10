import { json, fail, readJson } from './util.js';
import { currentUser, csrfOk } from './auth.js';

const table = [];
export function add(method, pattern, auth, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  table.push({ method, re, keys, auth, handler });
}

export async function dispatch(context) {
  const { request: req, env } = context;
  if (!env.DB) return fail(500, 'db_not_configured');
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  let match = null, pathMatched = false;
  for (const r of table) {
    const m = r.re.exec(path);
    if (!m) continue;
    pathMatched = true;
    if (r.method !== req.method) continue;
    match = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    break;
  }
  if (!match) return pathMatched ? fail(405, 'method_not_allowed') : fail(404, 'not_found');
  const { r, params } = match;
  try {
    if (r.auth !== 'webhook' && !csrfOk(req)) return fail(403, 'csrf');
    let user = null;
    if (r.auth === 'user' || r.auth === 'admin' || r.auth === 'optional') {
      user = await currentUser(env, req);
      if (!user && r.auth !== 'optional') return fail(401, 'no_session');
      if (r.auth === 'admin' && user.role !== 'admin') return fail(403, 'forbidden');
    }
    const ctx = { req, env, url, params, user, waitUntil: context.waitUntil?.bind(context) || (() => {}), body: (max) => readJson(req, max) };
    return await r.handler(ctx);
  } catch (err) {
    if (err && err.status) return fail(err.status, err.message);
    console.error('api_error', err && err.stack || err);
    return fail(500, 'server_error');
  }
}
export { json, fail };
