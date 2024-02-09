"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This MUST be first to ensure that `fetch` is defined in the React Native environment.
require("react-native/Libraries/Core/InitializeCore");
const expo_constants_1 = __importDefault(require("expo-constants"));
const Location_1 = require("./Location");
const getDevServer_1 = __importDefault(require("../getDevServer"));
let hasWarned = false;
const manifest = expo_constants_1.default.expoConfig;
// Add a development warning for fetch requests with relative paths
// to ensure developers are aware of the need to configure a production
// base URL in the Expo config (app.json) under `expo.extra.router.origin`.
function warnProductionOriginNotConfigured(requestUrl) {
    if (hasWarned) {
        return;
    }
    hasWarned = true;
    if (!manifest?.extra?.router?.origin) {
        console.warn(`The relative fetch request "${requestUrl}" will not work in production until the Expo Router Config Plugin (app.json) is configured with the \`origin\` prop set to the base URL of your web server, e.g. \`{ plugins: [["expo-router", { origin: "..." }]] }\`. [Learn more](https://expo.github.io/router/docs/lab/runtime-location)`);
    }
}
// TODO: This would be better if native and tied as close to the JS engine as possible, i.e. it should
// reflect the exact location of the JS file that was executed.
function getBaseUrl() {
    if (process.env.NODE_ENV !== 'production') {
        // e.g. http://localhost:19006
        return (0, getDevServer_1.default)().url?.replace(/\/$/, '');
    }
    // TODO: Make it official by moving out of `extra`
    const productionBaseUrl = manifest?.extra?.router?.origin;
    if (!productionBaseUrl) {
        return null;
    }
    // Ensure no trailing slash
    return productionBaseUrl?.replace(/\/$/, '');
}
function wrapFetchWithWindowLocation(fetch) {
    if (fetch.__EXPO_BASE_URL_POLYFILLED) {
        return fetch;
    }
    const _fetch = (...props) => {
        if (props[0] && typeof props[0] === 'string' && props[0].startsWith('/')) {
            if (process.env.NODE_ENV !== 'production') {
                warnProductionOriginNotConfigured(props[0]);
            }
            props[0] = new URL(props[0], window.location?.origin).toString();
        }
        else if (props[0] && typeof props[0] === 'object') {
            if (props[0].url && typeof props[0].url === 'string' && props[0].url.startsWith('/')) {
                if (process.env.NODE_ENV !== 'production') {
                    warnProductionOriginNotConfigured(props[0]);
                }
                props[0].url = new URL(props[0].url, window.location?.origin).toString();
            }
        }
        return fetch(...props);
    };
    _fetch.__EXPO_BASE_URL_POLYFILLED = true;
    return _fetch;
}
if (manifest?.extra?.router?.origin !== false) {
    // Polyfill window.location in native runtimes.
    if (typeof window !== 'undefined' && !window.location) {
        const url = getBaseUrl();
        if (url) {
            (0, Location_1.setLocationHref)(url);
            (0, Location_1.install)();
        }
    }
    // Polyfill native fetch to support relative URLs
    Object.defineProperty(global, 'fetch', {
        value: wrapFetchWithWindowLocation(fetch),
    });
}
//# sourceMappingURL=install.native.js.map