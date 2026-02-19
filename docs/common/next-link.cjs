'use strict';

var React = require('react');
var useRouter = require('next/router').useRouter;

/**
 * Minimal next/link replacement that renders consistent href values between
 * SSR and client hydration. The built-in next/link with trailingSlash: true
 * normalizes hrefs differently on server vs client, causing hydration errors.
 *
 * This shim strips trailing slashes from internal paths so both environments
 * produce identical markup.
 *
 * DROP THIS SHIM when any of these happen:
 * - Migrate from Pages Router to App Router (App Router handles trailing slashes consistently)
 * - @expo/styleguide's LinkBase stops wrapping next/link internally
 * - Next.js fixes trailing slash normalization in Pages Router's next/link
 *
 * When dropping, also remove the webpack alias in next.config.ts.
 */
function normalize(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href === '/') return href;
  var hashIdx = href.indexOf('#');
  var queryIdx = href.indexOf('?');
  var end = hashIdx > -1 ? hashIdx : queryIdx > -1 ? queryIdx : href.length;
  var path = href.slice(0, end);
  var suffix = href.slice(end);
  return (path.endsWith('/') ? path.slice(0, -1) : path) + suffix;
}

var Link = React.forwardRef(function Link(
  { href, as, prefetch, replace, shallow, scroll, locale, onNavigate, onClick, onMouseEnter, onTouchStart, ...rest },
  ref
) {
  var router = useRouter();
  var normalizedHref = normalize(typeof href === 'string' ? href : '');

  return React.createElement('a', {
    ...rest,
    ref,
    href: normalizedHref,
    onClick: function (e) {
      if (onClick) onClick(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.currentTarget.getAttribute('target');
      if ((t && t !== '_self') || e.currentTarget.hasAttribute('download') || !normalizedHref.startsWith('/')) return;
      e.preventDefault();
      router[replace ? 'replace' : 'push'](normalizedHref, undefined, { scroll: scroll !== false });
    },
    onMouseEnter: function (e) {
      if (onMouseEnter) onMouseEnter(e);
      if (prefetch !== false && normalizedHref.startsWith('/') && router.prefetch) {
        router.prefetch(normalizedHref).catch(function () {});
      }
    },
    onTouchStart: function (e) {
      if (onTouchStart) onTouchStart(e);
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
