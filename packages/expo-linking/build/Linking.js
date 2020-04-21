import Constants from 'expo-constants';
import qs from 'qs';
import { Platform } from 'react-native';
import URL from 'url-parse';
import Linking from './ExpoLinking';
const { manifest } = Constants;
function usesCustomScheme() {
    return Constants.appOwnership === 'standalone' && manifest.scheme;
}
function getHostUri() {
    if (!manifest.hostUri && !usesCustomScheme()) {
        // we're probably not using up-to-date xdl, so just fake it for now
        // we have to remove the /--/ on the end since this will be inserted again later
        return removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
    }
    return manifest.hostUri;
}
function isExpoHosted() {
    const hostUri = getHostUri();
    return !!(hostUri &&
        (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test)(:.*)?(\/.*)?$/.test(hostUri) ||
            manifest.developer));
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
function removeTrailingSlash(url) {
    return url.replace(/\/$/, '');
}
function removeTrailingSlashAndQueryString(url) {
    return url.replace(/\/?\?.*$/, '');
}
function ensureTrailingSlash(input, shouldAppend) {
    const hasSlash = input.endsWith('/');
    if (hasSlash && !shouldAppend) {
        return input.substring(0, input.length - 1);
    }
    else if (!hasSlash && shouldAppend) {
        return `${input}/`;
    }
    return input;
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
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
function makeUrl(path = '', queryParams = {}) {
    if (Platform.OS === 'web') {
        if (!canUseDOM)
            return '';
        const origin = ensureTrailingSlash(window.location.origin, false);
        let queryString = qs.stringify(queryParams);
        if (queryString) {
            queryString = `?${queryString}`;
        }
        let outputPath = path;
        if (outputPath)
            outputPath = ensureLeadingSlash(path, true);
        return encodeURI(`${origin}${outputPath}${queryString}`);
    }
    let scheme = 'exp';
    const manifestScheme = manifest.scheme ?? manifest?.detach?.scheme;
    if (Constants.appOwnership === 'standalone' && manifestScheme) {
        scheme = manifestScheme;
    }
    else if (Constants.appOwnership === 'standalone' && !manifestScheme) {
        throw new Error('Cannot make a deep link into a standalone app with no custom scheme defined');
    }
    else if (Constants.appOwnership === 'expo' && !manifestScheme) {
        console.warn('Linking requires that you provide a `scheme` in app.json for standalone apps - if it is left blank, your app may crash. The scheme does not apply to development in the Expo client but you should add it as soon as you start working with Linking to avoid creating a broken build. Add a `scheme` to silence this warning. Learn more about Linking at https://docs.expo.io/versions/latest/workflow/linking/');
    }
    let hostUri = getHostUri() || '';
    if (usesCustomScheme() && isExpoHosted()) {
        hostUri = '';
    }
    if (path) {
        if (isExpoHosted() && hostUri) {
            path = `/--/${removeLeadingSlash(path)}`;
        }
        if (!path.startsWith('/')) {
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
        catch (e) { }
        queryParams = {
            ...queryParams,
            ...paramsFromHostUri,
        };
    }
    queryString = qs.stringify(queryParams);
    if (queryString) {
        queryString = `?${queryString}`;
    }
    hostUri = removeTrailingSlash(hostUri);
    return encodeURI(`${scheme}://${hostUri}${path}${queryString}`);
}
function parse(url) {
    if (!url) {
        throw new Error('parse cannot be called with a null value');
    }
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
            expoPrefix = parts
                .slice(1)
                .concat(['--/'])
                .join('/');
        }
        if (isExpoHosted() && !usesCustomScheme() && expoPrefix && path.startsWith(expoPrefix)) {
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
async function parseInitialURLAsync() {
    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) {
        return {
            scheme: null,
            hostname: null,
            path: null,
            queryParams: null,
        };
    }
    return parse(initialUrl);
}
// @ts-ignore fix this...
const newLinking = new Linking.constructor();
newLinking.makeUrl = makeUrl;
newLinking.parse = parse;
newLinking.parseInitialURLAsync = parseInitialURLAsync;
export default newLinking;
//# sourceMappingURL=Linking.js.map