"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustPathname = exports.extractExpoPathFromURL = void 0;
const expo_constants_1 = __importStar(require("expo-constants"));
const Linking = __importStar(require("expo-linking"));
// This is only run on native.
function extractExactPathFromURL(url) {
    if (
    // If a universal link / app link / web URL is used, we should use the path
    // from the URL, while stripping the origin.
    url.match(/^https?:\/\//)) {
        const { origin, href } = new URL(url);
        return href.replace(origin, '');
    }
    // Handle special URLs used in Expo Go: `/--/pathname` -> `pathname`
    if (expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.StoreClient &&
        // while not exhaustive, `exp` and `exps` are the only two schemes which
        // are passed through to other apps in Expo Go.
        url.match(/^exp(s)?:\/\//)) {
        const pathname = url.match(/exps?:\/\/.*?\/--\/(.*)/)?.[1];
        if (pathname) {
            return fromDeepLink('a://' + pathname);
        }
        const res = Linking.parse(url);
        const qs = !res.queryParams
            ? ''
            : Object.entries(res.queryParams)
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
        return (adjustPathname({ hostname: res.hostname, pathname: res.path || '' }) + (qs ? '?' + qs : ''));
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
    const qs = !res.search
        ? ''
        : [...res.searchParams.entries()].map(([k, v]) => `${k}=${decodeURIComponent(v)}`).join('&');
    if (qs) {
        results += '?' + qs;
    }
    return results;
}
function extractExpoPathFromURL(url = '') {
    // TODO: We should get rid of this, dropping specificities is not good
    return extractExactPathFromURL(url).replace(/^\//, '');
}
exports.extractExpoPathFromURL = extractExpoPathFromURL;
function adjustPathname(url) {
    if (url.hostname === 'exp.host' || url.hostname === 'u.expo.dev') {
        // drop the first two segments from pathname:
        return url.pathname.split('/').slice(2).join('/');
    }
    return url.pathname;
}
exports.adjustPathname = adjustPathname;
//# sourceMappingURL=extractPathFromURL.js.map