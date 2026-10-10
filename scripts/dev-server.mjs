// Servidor local para desarrollo y pruebas: sirve /public y ejecuta las Functions con SQLite (node:sqlite) simulando D1.
// Uso: node scripts/dev-server.mjs [puerto]   (Node 22+)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { dispatch } from '../functions/_lib/router.js';
import '../functions/_lib/routes.js';
import '../functions/_lib/admin.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || process.env.PORT || 8788);

export function makeD1(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  for (const f of fs.readdirSync(path.join(root, 'migrations')).sort()) db.exec(fs.readFileSync(path.join(root, 'migrations', f), 'utf8'));
  return {
    prepare(sql) {
      const st = db.prepare(sql);
      const mk = (args) => ({
        first: async () => st.get(...args) ?? null,
        all: async () => ({ results: st.all(...args) }),
        run: async () => { const r = st.run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } }; },
      });
      return { bind: (...args) => mk(args), ...mk([]) };
    },
  };
}

const env = {
  DB: makeD1(process.env.LF_DB || ':memory:'),
  ADMIN_SETUP_TOKEN: process.env.ADMIN_SETUP_TOKEN || 'dev-setup-token',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test',
};
// aplica las cabeceras globales de public/_headers (CSP incluida) para probar igual que en producción
const globalHeaders = {};
try {
  const block = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8').split(/\n(?=\S)/).find((b) => b.startsWith('/*'));
  for (const l of block.split('\n').slice(1)) { const i = l.indexOf(':'); if (i > 0) globalHeaders[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }
} catch { /* sin _headers */ }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = await dispatch({ request, env, waitUntil: () => {} });
    const headers = {}; r.headers.forEach((v, k) => { headers[k] = v; });
    const sc = r.headers.getSetCookie?.(); if (sc?.length) headers['set-cookie'] = sc;
    res.writeHead(r.status, headers); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  let file = path.join(root, 'public', p);
  if (!file.startsWith(path.join(root, 'public'))) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, { 'content-type': 'text/html' }); return res.end(fs.existsSync(path.join(root, 'public/404.html')) ? fs.readFileSync(path.join(root, 'public/404.html')) : 'No encontrado'); }
  res.writeHead(200, { ...globalHeaders, 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Línea Frontera dev en http://localhost:${port}  (token admin: ${env.ADMIN_SETUP_TOKEN})`));
