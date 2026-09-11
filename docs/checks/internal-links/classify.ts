import { normalizePath } from './paths.ts';
import { type ParsedRedirects } from './redirects.ts';

const SITE_ORIGIN = 'https://docs.expo.dev';

export type ValidSets = {
  pages: Set<string>;
  files: Set<string>;
  redirects: ParsedRedirects;
};

export type LinkKind = 'skip' | 'external' | 'page' | 'file' | 'via-redirect' | 'broken';

export type ClassifiedLink = { kind: LinkKind; target?: string; hash?: string };

export function classifyHref(href: string, pagePath: string, sets: ValidSets): ClassifiedLink {
  if (href.startsWith('#')) {
    return href.length > 1
      ? { kind: 'page', target: normalizePath(pagePath), hash: href.slice(1) }
      : { kind: 'skip' };
  }

  let url: URL;
  try {
    const base = `${SITE_ORIGIN}${pagePath === '/' ? '' : pagePath}/`;
    url = new URL(href, base);
  } catch {
    return { kind: 'broken', target: href };
  }

  if (url.origin !== SITE_ORIGIN) {
    return { kind: 'external' };
  }

  const target = normalizePath(url.pathname);

  if (sets.pages.has(target)) {
    return url.hash.length > 1 && url.search === ''
      ? { kind: 'page', target, hash: url.hash.slice(1) }
      : { kind: 'page', target };
  }
  if (sets.files.has(target)) {
    return { kind: 'file', target };
  }
  if (target.endsWith('.md') && sets.pages.has(target.slice(0, -3))) {
    return { kind: 'file', target };
  }
  if (sets.redirects.literal.has(target)) {
    return { kind: 'via-redirect', target };
  }
  if (sets.redirects.splats.some(rule => rule.regex!.test(target))) {
    return { kind: 'via-redirect', target };
  }

  return { kind: 'broken', target };
}
