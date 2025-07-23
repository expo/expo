"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePathAndParamsFromExpoGoLink = parsePathAndParamsFromExpoGoLink;
exports.parsePathFromExpoGoLink = parsePathFromExpoGoLink;
exports.extractExpoPathFromURL = extractExpoPathFromURL;
function parsePathAndParamsFromExpoGoLink(url) {
    // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
    // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
    const href = parsePathFromExpoGoLink(url);
    const results = href.match(/([^?]*)(\?.*)?/);
    return {
        pathname: results?.[1] ?? '',
        queryString: results?.[2] ?? '',
    };
}
function parsePathFromExpoGoLink(url) {
    // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
    // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
    return url.match(/exps?:\/\/.*?\/--\/(.*)/)?.[1] ?? '';
}
// This is only run on native.
function extractExactPathFromURL(url) {
    if (
    // If a universal link / app link / web URL is used, we should use the path
    // from the URL, while stripping the origin.
    url.match(/^https?:\/\//)) {
        const { origin, href, hostname } = new URL(url);
        if (hostname === 'exp.host' || hostname === 'u.expo.dev') {
            // These are QR code generate deep-link that always like to the '/' path
            // TODO: In the future, QR code may link to a specific path and this logic will need to be udpated
            return '';
        }
        return href.replace(origin, '');
    }
    const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;
    // Handle special URLs used in Expo Go: `/--/pathname` -> `pathname`
    if (isExpoGo &&
        // while not exhaustive, `exp` and `exps` are the only two schemes which
        // are passed through to other apps in Expo Go.
        url.match(/^exp(s)?:\/\//)) {
        const pathname = parsePathFromExpoGoLink(url);
        if (pathname) {
            return fromDeepLink('a://' + pathname);
        }
        // Match the `?.*` segment of the URL.
        const queryParams = url.match(/exps?:\/\/.*\?(.*)/)?.[1];
        if (queryParams) {
            return fromDeepLink('a://?' + queryParams);
        }
        return '';
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
    }
    catch {
        /**
         * We failed to parse the URL. This can occur for a variety of reasons, including:
         * - Its a partial URL (e.g. `/route?query=param`).
         * - It has a valid App scheme, but the scheme isn't a valid URL scheme (e.g. `my_app://`)
         */
        /**
         * App schemes are not valid URL schemes, so they will fail to parse.
         * We need to strip the scheme from these URLs
         */
        return url.replace(/^[^:]+:\/\//, '');
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
    const qs = !res.search
        ? ''
        : // @ts-ignore: `entries` is not on `URLSearchParams` in some typechecks.
            [...res.searchParams.entries()].map(([k, v]) => `${k}=${decodeURIComponent(v)}`).join('&');
    if (qs) {
        results += '?' + qs;
    }
    return results;
}
function extractExpoPathFromURL(_prefixes, url = '') {
    return (extractExactPathFromURL(url)
        // TODO: We should get rid of this, dropping specificities is not good
        .replace(/^\//, ''));
}
//# sourceMappingURL=extractPathFromURL.js.map