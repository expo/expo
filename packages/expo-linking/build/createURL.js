import Constants from 'expo-constants';
import qs from 'qs';
import URL from 'url-parse';
import { hasCustomScheme, resolveScheme } from './Schemes';
import { validateURL } from './validateURL';
function getHostUri() {
    if (Constants.expoConfig?.hostUri) {
        return Constants.expoConfig.hostUri;
    }
    else if (!hasCustomScheme()) {
        // we're probably not using up-to-date xdl, so just fake it for now
        // we have to remove the /--/ on the end since this will be inserted again later
        return removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
    }
    else {
        return null;
    }
}
function isExpoHosted() {
    const hostUri = getHostUri();
    return !!(hostUri &&
        (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test|expo\.dev)(:.*)?(\/.*)?$/.test(hostUri) ||
            Constants.expoGoConfig?.developer));
}
function removeScheme(url) {
    return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}
function removePort(url) {
    return url.replace(/(?=([a-zA-Z0-9+.-]+:\/\/)?[^/]):\d+/, '');
}
function removeLeadingSlash(url) {
    return url.replace(/^\//, '');
}
function removeTrailingSlashAndQueryString(url) {
    return url.replace(/\/?\?.*$/, '');
}
function ensureLeadingSlash(input, shouldAppend) {
    const hasSlash = input.startsWith('/');
    if (hasSlash && !shouldAppend) {
        return input.substring(1);
    }
    else if (!hasSlash && shouldAppend) {
        return `/${input}`;
    }
    return input;
}
// @needsAudit
/**
 * Helper method for constructing a deep link into your app, given an optional path and set of query
 * parameters. Creates a URI scheme with two slashes by default.
 *
 * The scheme in bare and standalone must be defined in the Expo config (`app.config.js` or `app.json`)
 * under `expo.scheme`.
 *
 * # Examples
 * - Bare: `<scheme>://path` - uses provided scheme or scheme from Expo config `scheme`.
 * - Standalone, Custom: `yourscheme://path`
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Client (dev): `exp://128.0.0.1:8081/--/path`
 * - Expo Client (prod): `exp://exp.host/@yourname/your-app/--/path`
 *
 * @param path Addition path components to append to the base URL.
 * @param namedParameters Additional options object.
 * @return A URL string which points to your app with the given deep link information.
 */
export function createURL(path, { scheme, queryParams = {}, isTripleSlashed = false } = {}) {
    const resolvedScheme = resolveScheme({ scheme });
    let hostUri = getHostUri() || '';
    if (hasCustomScheme() && isExpoHosted()) {
        hostUri = '';
    }
    if (path) {
        if (isExpoHosted() && hostUri) {
            path = `/--/${removeLeadingSlash(path)}`;
        }
        if (isTripleSlashed && !path.startsWith('/')) {
            path = `/${path}`;
        }
    }
    else {
        path = '';
    }
    // merge user-provided query params with any that were already in the hostUri
    // e.g. release-channel
    let queryString = '';
    const queryStringMatchResult = hostUri.match(/(.*)\?(.+)/);
    if (queryStringMatchResult) {
        hostUri = queryStringMatchResult[1];
        queryString = queryStringMatchResult[2];
        let paramsFromHostUri = {};
        try {
            const parsedParams = qs.parse(queryString);
            if (typeof parsedParams === 'object') {
                paramsFromHostUri = parsedParams;
            }
        }
        catch { }
        queryParams = {
            ...queryParams,
            ...paramsFromHostUri,
        };
    }
    queryString = qs.stringify(queryParams);
    if (queryString) {
        queryString = `?${queryString}`;
    }
    hostUri = ensureLeadingSlash(hostUri, !isTripleSlashed);
    return encodeURI(`${resolvedScheme}:${isTripleSlashed ? '/' : ''}/${hostUri}${path}${queryString}`);
}
// @needsAudit
/**
 * Helper method for parsing out deep link information from a URL.
 * @param url A URL that points to the currently running experience (e.g. an output of `Linking.createURL()`).
 * @return A `ParsedURL` object.
 */
export function parse(url) {
    validateURL(url);
    const parsed = URL(url, /* parseQueryString */ true);
    for (const param in parsed.query) {
        parsed.query[param] = decodeURIComponent(parsed.query[param]);
    }
    const queryParams = parsed.query;
    const hostUri = getHostUri() || '';
    const hostUriStripped = removePort(removeTrailingSlashAndQueryString(hostUri));
    let path = parsed.pathname || null;
    let hostname = parsed.hostname || null;
    let scheme = parsed.protocol || null;
    if (scheme) {
        // Remove colon at end
        scheme = scheme.substring(0, scheme.length - 1);
    }
    if (path) {
        path = removeLeadingSlash(path);
        let expoPrefix = null;
        if (hostUriStripped) {
            const parts = hostUriStripped.split('/');
            expoPrefix = parts.slice(1).concat(['--/']).join('/');
        }
        if (isExpoHosted() && !hasCustomScheme() && expoPrefix && path.startsWith(expoPrefix)) {
            path = path.substring(expoPrefix.length);
            hostname = null;
        }
        else if (path.indexOf('+') > -1) {
            path = path.substring(path.indexOf('+') + 1);
        }
    }
    return {
        hostname,
        path,
        queryParams,
        scheme,
    };
}
//# sourceMappingURL=createURL.js.map