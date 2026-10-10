// Genera public/index.html con el contenido por defecto ya renderizado (SEO y carga rápida).
// Uso: node scripts/bake.mjs   (también corre como build de Cloudflare Pages)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const S = require(path.join(root, 'public/assets/js/lf-shared.js'));
const R = require(path.join(root, 'public/assets/js/lf-render.js'));
const e = S.esc;

const c = S.resolveContent({});
let html = fs.readFileSync(path.join(root, 'templates/index.html'), 'utf8');
const map = {
  TITLE: e(c.seo.title), DESC: e(c.seo.description), HASH: S.contentHash(c), DOMAIN: e(c.brand.domain), NAME: e(c.brand.name),
  THEME: R.themeCss(c), JSONLD: R.renderJsonLd(c), BODY: R.renderBody(c),
};
for (const [k, v] of Object.entries(map)) html = html.split(`<!--LF:${k}-->`).join(v);
fs.writeFileSync(path.join(root, 'public/index.html'), html);

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ['/', '/aviso-de-privacidad.html', '/terminos.html'].map((p) => `  <url><loc>https://${c.brand.domain}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
console.log(`index.html listo (${(html.length / 1024).toFixed(1)} KB, hash ${map.HASH})`);
