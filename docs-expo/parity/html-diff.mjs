import * as cheerio from 'cheerio';
// Usage: node parity/html-diff.mjs <nextOut> <expoDist> [--limit N] [--show N]
// Compares the static HTML of each page: the element tree under #__next, and the head tags.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [nextRoot, expoRoot] = args;
const opt = name => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const limit = Number(opt('limit') ?? Infinity),
  show = Number(opt('show') ?? 15);

function listPages(root, dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory())
      return ['_next', '_expo', 'static', 'assets', 'data'].includes(rel)
        ? []
        : listPages(root, rel);
    return e.name === 'index.html' ? [rel] : [];
  });
}

const SKIP = new Set(['script', 'style', 'template', 'link', 'meta', 'title']);
function bodyTokens($) {
  const out = [];
  const walk = el => {
    if (el.type === 'text') {
      const t = el.data.replace(/\s+/g, ' ').trim();
      if (t) out.push(`#text ${t}`);
      return;
    }
    if (el.type !== 'tag' || SKIP.has(el.name)) return;
    const attrs = Object.entries(el.attribs)
      .filter(([k]) => k !== 'data-next-head')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    out.push(`<${el.name} ${attrs}>`.replace(/_R_[a-z0-9]+_/g, '_R_ID_'));
    el.children.forEach(walk);
  };
  $('#__next')
    .contents()
    .each((_, el) => walk(el));
  return out;
}
function headTokens($) {
  const out = [];
  $('title, meta, link, script[type="application/ld+json"]').each((_, el) => {
    const a = el.attribs;
    if (el.name === 'link' && ['preload', 'stylesheet', 'modulepreload'].includes(a.rel)) return;
    if (el.name === 'title') return out.push(`title ${$(el).text()}`);
    if (el.name === 'script') return out.push(`jsonld ${$(el).html()}`);
    out.push(
      `${el.name} ${Object.entries(a)
        .filter(([k]) => !['data-next-head', 'data-server-head'].includes(k))
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([k, v]) => `${k.toLowerCase()}=${JSON.stringify(v)}`)
        .join(' ')}`
    );
  });
  return out.sort();
}

const pages = listPages(nextRoot).sort().slice(0, limit);
let bodySame = 0,
  headSame = 0,
  shown = 0;
const kinds = new Map();
for (const page of pages) {
  const expoFile = path.join(expoRoot, page);
  if (!fs.existsSync(expoFile)) {
    console.log(`MISSING in expo: ${page}`);
    continue;
  }
  const $n = cheerio.load(fs.readFileSync(path.join(nextRoot, page), 'utf8')),
    $e = cheerio.load(fs.readFileSync(expoFile, 'utf8'));
  const [bn, be] = [bodyTokens($n), bodyTokens($e)];
  let i = 0;
  while (i < bn.length && i < be.length && bn[i] === be[i]) i++;
  if (i === bn.length && i === be.length) bodySame++;
  else {
    const kind = `${(bn[i] ?? 'END').slice(0, 60)}`;
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    if (shown++ < show) {
      const x = String(bn[i]),
        y = String(be[i]);
      let j = 0;
      while (j < x.length && x[j] === y[j]) j++;
      const from = Math.max(0, j - 50);
      console.log(
        `BODY ${page} @${i} (${bn.length} vs ${be.length}) ${x.slice(0, 40)}\n   next …${x.slice(from, from + 200)}\n   expo …${y.slice(from, from + 200)}`
      );
    }
  }
  const [hn, he] = [headTokens($n), headTokens($e)];
  const onlyNext = hn.filter(t => !he.includes(t)),
    onlyExpo = he.filter(t => !hn.includes(t));
  if (!onlyNext.length && !onlyExpo.length) headSame++;
  else if (shown++ < show)
    console.log(
      `HEAD ${page}\n   only next ${JSON.stringify(onlyNext).slice(0, 300)}\n   only expo ${JSON.stringify(onlyExpo).slice(0, 300)}`
    );
}
console.log(`pages ${pages.length}: body identical ${bodySame}, head identical ${headSame}`);
console.log(
  [...kinds]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k, n]) => `${n} × ${k}`)
    .join('\n')
);
