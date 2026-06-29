import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DOCS_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const JA_DIR = path.join(DOCS_ROOT, 'pages', 'ja');
export const MANIFEST_PATH = path.join(DOCS_ROOT, 'checks', 'ja', 'source-hashes.json');

export function listJaPages(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) {
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.mdx')) {
        out.push(full);
      }
    }
  };
  walk(JA_DIR);
  return out;
}

export function relKey(jaPath: string): string {
  return path.relative(JA_DIR, jaPath).split(path.sep).join('/');
}

export function englishSourceFor(jaPath: string): string {
  return path.join(DOCS_ROOT, 'pages', path.relative(JA_DIR, jaPath));
}

export function hashEnglishSource(englishPath: string): string {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(englishPath))
    .digest('hex')
    .slice(0, 16);
}

export function readManifest(): Record<string, string> {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}
