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

function rewriteMarkdownLinks(text: string): string {
  return text.replace(
    /(!?\[(?:[^\n[\]]|\[[^\n[\]]*])+]\()([^\s)]+)((?:\s+["'][^\n)]*["'])?\))/g,
    (match, prefix: string, url: string, suffix: string) => {
      if (prefix.startsWith('!')) {
        return match;
      }

      if (url.startsWith(DOCS_BASE_URL_WITH_SLASH)) {
        return `${prefix}${getMarkdownUrl(url.slice(DOCS_BASE_URL.length))}${suffix}`;
      }

      if (url.startsWith('/') && !url.startsWith('//')) {
        return `${prefix}${getMarkdownUrl(url)}${suffix}`;
      }

      return match;
    }
  );
}

function transformOutsideCodeFences(content: string, transform: (text: string) => string): string {
  // The fence marker (`` ` `` or `~`) that opened the current code block, or null when outside one.
  // Tracking the marker keeps a ``` line from prematurely closing a ~~~ block and vice versa.
  let fenceMarker: string | null = null;
  let proseLines: string[] = [];
  const output: string[] = [];

  const flushProse = () => {
    if (proseLines.length > 0) {
      output.push(transform(proseLines.join('\n')));
      proseLines = [];
    }
  };

  for (const line of content.split('\n')) {
    const marker = line.match(CODE_FENCE_REGEX)?.[1][0];
    if (fenceMarker === null && marker) {
      flushProse();
      fenceMarker = marker;
      output.push(line);
    } else if (fenceMarker !== null) {
      if (marker === fenceMarker) {
        fenceMarker = null;
      }
      output.push(line);
    } else {
      proseLines.push(line);
    }
  }
  flushProse();

  return output.join('\n');
}

export function joinWrappedLinkText(content: string): string {
  return transformOutsideCodeFences(content, text =>
    text.replace(/\[[^[\]]*]\(/g, linkText =>
      /\n\s*\n/.test(linkText) ? linkText : linkText.replace(/\s*\n\s*/g, ' ')
    )
  );
}

export function rewriteDocsLinksToMarkdown(content: string): string {
  return transformOutsideCodeFences(content, rewriteMarkdownLinks);
}
