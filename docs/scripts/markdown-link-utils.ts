export const DOCS_BASE_URL = 'https://docs.expo.dev';

const DOCS_BASE_URL_WITH_SLASH = `${DOCS_BASE_URL}/`;
const CODE_FENCE_REGEX = /^\s{0,3}(`{3,}|~{3,})/;

function splitUrlSuffix(url: string): { pathname: string; suffix: string } {
  const suffixIndex = url.search(/[#?]/);
  if (suffixIndex === -1) {
    return { pathname: url, suffix: '' };
  }

  return {
    pathname: url.slice(0, suffixIndex),
    suffix: url.slice(suffixIndex),
  };
}

function hasFileExtension(pathname: string): boolean {
  const match = pathname.match(/\.([^./]+)$/);
  // A purely numeric "extension" (e.g. the trailing `0` in `/versions/v51.0.0`) is part of a
  // version segment, not a real file extension, so such hrefs should still be converted to `.md`.
  return match !== null && !/^\d+$/.test(match[1]);
}

export function getMarkdownHref(href: string): string {
  if (!href || href.startsWith('#')) {
    return href;
  }

  const { pathname, suffix } = splitUrlSuffix(href);
  if (!pathname || hasFileExtension(pathname)) {
    return href;
  }

  const normalizedPathname =
    pathname === '/' ? '/index' : pathname.replace(/\/+$/g, '').replace(/^([^/])/, '/$1');

  return `${normalizedPathname}.md${suffix}`;
}

export function getMarkdownUrl(href: string): string {
  return `${DOCS_BASE_URL}${getMarkdownHref(href)}`;
}

function rewriteMarkdownLinks(line: string): string {
  return line.replace(
    /(!?\[[^\n\]]+]\()([^\s)]+)((?:\s+["'][^\n)]*["'])?\))/g,
    (match, prefix: string, url: string, suffix: string) => {
      if (prefix.startsWith('!')) {
        return match;
      }

      if (url.startsWith(DOCS_BASE_URL_WITH_SLASH)) {
        return `${prefix}${getMarkdownUrl(url.slice(DOCS_BASE_URL.length))}${suffix}`;
      }

      if (url.startsWith('/') && !url.startsWith('//')) {
        return `${prefix}${getMarkdownHref(url)}${suffix}`;
      }

      return match;
    }
  );
}

export function rewriteDocsLinksToMarkdown(content: string): string {
  // The fence marker (`` ` `` or `~`) that opened the current code block, or null when outside one.
  // Tracking the marker keeps a ``` line from prematurely closing a ~~~ block and vice versa.
  let fenceMarker: string | null = null;

  return content
    .split('\n')
    .map(line => {
      const fenceMatch = line.match(CODE_FENCE_REGEX);
      if (fenceMatch) {
        const marker = fenceMatch[1][0];
        if (fenceMarker === null) {
          fenceMarker = marker;
          return line;
        }
        if (marker === fenceMarker) {
          fenceMarker = null;
          return line;
        }
      }

      if (fenceMarker !== null) {
        return line;
      }

      return rewriteMarkdownLinks(line);
    })
    .join('\n');
}
