import S from '../../public/assets/js/lf-shared.js';
import { now } from './util.js';

export async function getContent(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'content'").first();
  let saved = {};
  try { saved = row ? JSON.parse(row.value) : {}; } catch { saved = {}; }
  const content = S.resolveContent(saved);
  return { content, hash: S.contentHash(content), custom: !!row };
}

export async function saveContent(env, raw, label, author) {
  const content = S.sanitizeContent(raw);
  const json = JSON.stringify(content);
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('content', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(json).run();
  await env.DB.prepare('INSERT INTO content_versions (content, label, author, created_at) VALUES (?,?,?,?)').bind(json, String(label || '').slice(0, 80), String(author || '').slice(0, 80), now()).run();
  await env.DB.prepare('DELETE FROM content_versions WHERE id NOT IN (SELECT id FROM content_versions ORDER BY id DESC LIMIT 50)').run();
  return { content, hash: S.contentHash(content) };
}

export { S };
