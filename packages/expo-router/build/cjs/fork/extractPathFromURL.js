"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.adjustPathname = adjustPathname;
exports.extractExpoPathFromURL = extractExpoPathFromURL;
function Linking() {
  const data = _interopRequireWildcard(require("expo-linking"));
  Linking = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// This is only run on native.
function extractExactPathFromURL(url) {
  if (
  // If a universal link / app link / web URL is used, we should use the path
  // from the URL, while stripping the origin.
  url.match(/^https?:\/\//)) {
    const {
      origin,
      href
    } = new URL(url);
    return href.replace(origin, '');
  }
  const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;

  // Handle special URLs used in Expo Go: `/--/pathname` -> `pathname`
  if (isExpoGo &&
  // while not exhaustive, `exp` and `exps` are the only two schemes which
  // are passed through to other apps in Expo Go.
  url.match(/^exp(s)?:\/\//)) {
    const pathname = url.match(/exps?:\/\/.*?\/--\/(.*)/)?.[1];
    if (pathname) {
      return fromDeepLink('a://' + pathname);
    }
    const res = Linking().parse(url);
    const qs = !res.queryParams ? '' : Object.entries(res.queryParams).map(([k, v]) => `${k}=${v}`).join('&');
    return adjustPathname({
      hostname: res.hostname,
      pathname: res.path || ''
    }) + (qs ? '?' + qs : '');
  }

  // TODO: Support dev client URLs

  return fromDeepLink(url);
}

/** Major hack to support the makeshift expo-development-client system. */
function isExpoDevelopmentClient(url) {
  return url.hostname === 'expo-development-client';
}
function fromDeepLink(url) {
  let res;
  try {
    // This is for all standard deep links, e.g. `foobar://` where everything
    // after the `://` is the path.
    res = new URL(url);
  } catch {
    return url;
  }
  if (isExpoDevelopmentClient(res)) {
    if (!res.searchParams.get('url')) {
      return '';
    }
    const incomingUrl = res.searchParams.get('url');
    return extractExactPathFromURL(decodeURI(incomingUrl));
  }
  let results = '';
  if (res.host) {
    results += res.host;
  }
  if (res.pathname) {
    results += res.pathname;
  }
  const qs = !res.search ? '' :
  // @ts-ignore: `entries` is not on `URLSearchParams` in some typechecks.
  [...res.searchParams.entries()].map(([k, v]) => `${k}=${decodeURIComponent(v)}`).join('&');
  if (qs) {
    results += '?' + qs;
  }
  return results;
}
function extractExpoPathFromURL(url = '') {
  // TODO: We should get rid of this, dropping specificities is not good
  return extractExactPathFromURL(url).replace(/^\//, '');
}
function adjustPathname(url) {
  if (url.hostname === 'exp.host' || url.hostname === 'u.expo.dev') {
    // drop the first two segments from pathname:
    return url.pathname.split('/').slice(2).join('/');
  }
  return url.pathname;
}
//# sourceMappingURL=extractPathFromURL.js.map