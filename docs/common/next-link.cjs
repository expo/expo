'use strict';

const { useRouter } = require('next/router');
const React = require('react');

/**
 * Minimal next/link replacement that renders consistent href values between
 * SSR and client hydration. The built-in next/link with trailingSlash: true
 * normalizes hrefs differently on server vs client, causing hydration errors.
 *
 * This shim normalizes internal page paths to trailing-slash form so both
 * environments produce identical markup.
 *
 * DROP THIS SHIM when any of these happen:
 * - Migrate from Pages Router to App Router (App Router handles trailing slashes consistently)
 * - @expo/styleguide's LinkBase stops wrapping next/link internally
 * - Next.js fixes trailing slash normalization in Pages Router's next/link
 *
 * When dropping, also remove the webpack alias in next.config.ts.
 */
function normalize(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href === '/') {
    return href;
  }
  const hashIdx = href.indexOf('#');
  const queryIdx = href.indexOf('?');
  const end =
    hashIdx > -1 && queryIdx > -1
      ? Math.min(hashIdx, queryIdx)
      : hashIdx > -1
        ? hashIdx
        : queryIdx > -1
          ? queryIdx
          : href.length;
  let path = href.slice(0, end);
  const suffix = href.slice(end);
  // Resolve ".." and "." segments (MDX links can produce paths like /../../../workflow/overview)
  if (path.includes('..') || path.includes('./')) {
    path = new URL(path, 'http://localhost').pathname;
  }
  // Keep file-like paths unchanged (e.g. /favicon.ico) and normalize page-like
  // paths to trailing-slash form, including hash/query variants.
  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(path);
  if (!path.endsWith('/') && !hasFileExtension) {
    path += '/';
  }
  return path + suffix;
}

const Link = React.forwardRef(function Link(
  {
    href,
    as,
    prefetch,
    replace,
    shallow,
    scroll,
    locale,
    onNavigate,
    onClick,
    onMouseEnter,
    onTouchStart,
    ...rest
  },
  ref
) {
  const router = useRouter();
  const normalizedHref = normalize(typeof href === 'string' ? href : '');

  return React.createElement('a', {
    ...rest,
    ref,
    href: normalizedHref,
    onClick(event) {
      if (onClick) {
        onClick(event);
      }
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.currentTarget.getAttribute('target');
      if (
        (target && target !== '_self') ||
        event.currentTarget.hasAttribute('download') ||
        !normalizedHref.startsWith('/')
      ) {
        return;
      }
      event.preventDefault();
      router[replace ? 'replace' : 'push'](normalizedHref, undefined, { scroll: scroll !== false });
    },
    onMouseEnter(event) {
      if (onMouseEnter) {
        onMouseEnter(event);
      }
      if (prefetch !== false && normalizedHref.startsWith('/') && router.prefetch) {
        router.prefetch(normalizedHref).catch(function () {});
      }
    },
    onTouchStart(event) {
      if (onTouchStart) {
        onTouchStart(event);
      }
      if (prefetch !== false && normalizedHref.startsWith('/') && router.prefetch) {
        router.prefetch(normalizedHref).catch(function () {});
      }
    },
  });
});

Link.displayName = 'Link';

module.exports = Link;
module.exports.default = Link;
module.exports.useLinkStatus = function () {
  return { pending: false };
};
