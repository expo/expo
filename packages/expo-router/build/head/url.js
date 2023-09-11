"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaticUrlFromExpoRouter = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const url_parse_1 = __importDefault(require("url-parse"));
const protocolWarningString = `{ plugins: [["expo-router", { origin: "...<URL>..." }]] }`;
/** `lodash.memoize` */
function memoize(fn) {
    const cache = {};
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache[key]) {
            return cache[key];
        }
        const result = fn(...args);
        cache[key] = result;
        return result;
    });
}
function sanitizeUrl(url) {
    const parsed = new url_parse_1.default(url);
    // Allow empty protocol, http, and https
    const validProtocol = !parsed.protocol || parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!validProtocol) {
        throwOrAlert(`Expo Head: Native origin has invalid protocol "${parsed.protocol}" for URL in Expo Config: ${protocolWarningString}.`);
    }
    parsed.set('pathname', '');
    parsed.set('query', {});
    parsed.set('hash', undefined);
    parsed.set('protocol', parsed.protocol ?? 'https:');
    return parsed.toString().replace(/\/$/, '');
}
const memoSanitizeUrl = memoize(sanitizeUrl);
function getUrlFromConstants() {
    // This will require a rebuild in bare-workflow to update.
    const manifest = expo_constants_1.default.expoConfig;
    const origin = manifest?.extra?.router?.headOrigin ?? manifest?.extra?.router?.origin;
    if (!origin) {
        throwOrAlert(`Expo Head: Add the handoff origin to the Expo Config (requires rebuild). Add the Config Plugin ${protocolWarningString}, where \`origin\` is the hosted URL.`);
        // Fallback value that shouldn't be used for real.
        return 'https://expo.dev';
    }
    // Without this, the URL will go to an IP address which is not allowed.
    if (!origin.match(/^http(s)?:\/\//)) {
        console.warn(`Expo Head: origin "${origin}" is missing a \`https://\` protocol. ${protocolWarningString}.`);
    }
    // Return the development URL last so the user gets all production warnings first.
    return memoSanitizeUrl(origin);
}
function throwOrAlert(msg) {
    // Production apps fatally crash which is often not helpful.
    if (
    // @ts-ignore: process is defined
    process.env.NODE_ENV === 'production') {
        console.error(msg);
        alert(msg);
    }
    else {
        throw new Error(msg);
    }
}
function getStaticUrlFromExpoRouter(pathname) {
    // const host = "https://expo.io";
    // Append the URL we'd find in context
    return getUrlFromConstants() + pathname;
}
exports.getStaticUrlFromExpoRouter = getStaticUrlFromExpoRouter;
//# sourceMappingURL=url.js.map