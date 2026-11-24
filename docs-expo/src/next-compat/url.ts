export function isInternal(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function removeDotSegments(pathname: string) {
  const segments: string[] = [];
  for (const segment of pathname.split('/')) {
    if (segment === '..') {
      if (segments.length > 1) {
        segments.pop();
      }
    } else if (segment !== '.') {
      segments.push(segment);
    }
  }
  return segments.join('/') || '/';
}

/**
 * Changes an internal URL in the same way as Next.js does when `trailingSlash` is `true`:
 * it resolves `.` and `..` segments and adds a trailing slash.
 *
 * `../docs/mdx-plugins/remark-link-rewrite.js` relies on the first step. It writes
 * an absolute link as `/../../<path>`.
 */
export function normalizeHref(href: string) {
  if (!isInternal(href)) {
    return href;
  }
  const [, rawPathname, suffix] = href.match(/^([^?#]*)(.*)$/)!;
  const pathname = removeDotSegments(rawPathname);
  // Next.js removes the slash after a last segment that looks like a file name. That
  // includes a segment such as `v58.0.0`.
  if (/\.[^/]+\/?$/.test(pathname)) {
    return `${pathname.replace(/\/$/, '')}${suffix}`;
  }
  return `${pathname.endsWith('/') ? pathname : `${pathname}/`}${suffix}`;
}

/**
 * Gives the URL that the Next.js `Link` component renders for `href` on the page
 * `currentPathname`. Next.js resolves a relative URL from the current page. A URL with a
 * scheme and a URL that is only a hash stay as they are.
 */
export function resolveHref(href: string, currentPathname: string) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) {
    return href;
  }
  if (href.startsWith('/')) {
    return normalizeHref(href);
  }
  // Next.js resolves from the page path without its trailing slash, so `./other` on the
  // page `/sdk/camera/` is `/sdk/other/`.
  const pagePath = currentPathname.replace(/\/$/, '');
  const directory = pagePath.slice(0, pagePath.lastIndexOf('/') + 1);
  return normalizeHref(`${directory}${href}`);
}
