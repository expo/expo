/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/client.ts#L1
 */
//// <reference types="react/canary" />
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRoot = exports.Children = exports.Slot = exports.useRefetch = exports.Root = exports.prefetchRSC = exports.fetchRSC = exports.callServerRSC = void 0;
const react_1 = require("react");
const client_1 = __importDefault(require("react-server-dom-webpack/client"));
const errors_1 = require("./errors");
const fetch_1 = require("./fetch");
const utils_1 = require("./utils");
const getDevServer_1 = require("../../getDevServer");
const url_1 = require("../../head/url");
const { createFromFetch, encodeReply } = client_1.default;
// TODO: Maybe this could be a bundler global instead.
const IS_DOM = 
// @ts-expect-error: Added via react-native-webview
typeof ReactNativeWebView !== 'undefined';
// NOTE: Ensured to start with `/`.
const RSC_PATH = '/_flight/' + process.env.EXPO_OS; // process.env.EXPO_RSC_PATH;
// Using base URL for remote hosts isn't currently supported in DOM components as we use it for offline assets.
const BASE_URL = IS_DOM ? '' : process.env.EXPO_BASE_URL;
let BASE_PATH = `${BASE_URL}${RSC_PATH}`;
if (!BASE_PATH.startsWith('/')) {
    BASE_PATH = '/' + BASE_PATH;
}
if (!BASE_PATH.endsWith('/')) {
    BASE_PATH += '/';
}
if (BASE_PATH === '/') {
    throw new Error(`Invalid React Flight path "${BASE_PATH}". The path should not live at the project root, e.g. /_flight/. Dev server URL: ${(0, getDevServer_1.getDevServer)().fullBundleUrl}`);
}
if (process.env.EXPO_OS !== 'web' && !window.location?.href) {
    // This can happen if the user attempts to use React Server Components without
    // enabling the flags in the app.json. This will set origin to false and prevent the expo/metro-runtime polyfill from running.
    throw new Error('window.location.href is not defined. This is required for React Server Components to work correctly. Ensure React Server Components is correctly enabled in your project and config.');
}
const RSC_CONTENT_TYPE = 'text/x-component';
const ENTRY = 'e';
const SET_ELEMENTS = 's';
const ON_FETCH_DATA = 'o';
const defaultFetchCache = {};
const NO_CACHE_HEADERS = process.env.EXPO_OS === 'web'
    ? {}
    : // These are needed for iOS + Prod to get updates after the first request.
        {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
        };
const ACTION_HEADERS = {
    ...NO_CACHE_HEADERS,
    accept: RSC_CONTENT_TYPE,
    'expo-platform': process.env.EXPO_OS,
};
const checkStatus = async (responsePromise) => {
    // TODO: Combine with metro async fetch logic.
    const response = await responsePromise;
    if (!response.ok) {
        // NOTE(EvanBacon): Transform the Metro development error into a JS error that can be used by LogBox.
        // This was tested against using a Class component in a server component.
        if (__DEV__ && (response.status === 500 || response.status === 404)) {
            const errorText = await response.text();
            let errorJson;
            try {
                errorJson = JSON.parse(errorText);
            }
            catch {
                // `Unable to resolve module` error should respond as JSON from the dev server and sent to the master red box, this can get corrupt when it's returned as the formatted string.
                if (errorText.startsWith('Unable to resolve module')) {
                    console.error('Unexpected Metro error format from dev server');
                    // This is an unexpected state that occurs when the dev server renderer does not throw Metro errors in the expected JSON format.
                    throw new Error(errorJson);
                }
                throw new errors_1.ReactServerError(errorText, response.url, response.status, response.headers);
            }
            throw new errors_1.MetroServerError(errorJson, response.url);
        }
        let responseText;
        try {
            responseText = await response.text();
        }
        catch {
            throw new errors_1.ReactServerError(response.statusText, response.url, response.status, response.headers);
        }
        throw new errors_1.ReactServerError(responseText, response.url, response.status, response.headers);
    }
    return response;
};
function getCached(c, m, k) {
    return (m.has(k) ? m : m.set(k, c())).get(k);
}
const cache1 = new WeakMap();
const mergeElements = (a, b) => {
    const getResult = () => {
        const promise = new Promise((resolve, reject) => {
            Promise.all([a, b])
                .then(([a, b]) => {
                const nextElements = { ...a, ...b };
                delete nextElements._value;
                promise.prev = a;
                resolve(nextElements);
            })
                .catch((e) => {
                a.then((a) => {
                    promise.prev = a;
                    reject(e);
                }, () => {
                    promise.prev = a.prev;
                    reject(e);
                });
            });
        });
        return promise;
    };
    const cache2 = getCached(() => new WeakMap(), cache1, a);
    return getCached(getResult, cache2, b);
};
/**
 * callServer callback
 * This is not a public API.
 */
const callServerRSC = async (actionId, args, fetchCache = defaultFetchCache) => {
    const url = getAdjustedRemoteFilePath(BASE_PATH + (0, utils_1.encodeInput)((0, utils_1.encodeActionId)(actionId)));
    const response = args === undefined
        ? (0, fetch_1.fetch)(url, { headers: ACTION_HEADERS })
        : encodeReply(args).then((body) => (0, fetch_1.fetch)(url, { method: 'POST', body, headers: ACTION_HEADERS }));
    const data = createFromFetch(checkStatus(response), {
        callServer: (actionId, args) => (0, exports.callServerRSC)(actionId, args, fetchCache),
    });
    fetchCache[ON_FETCH_DATA]?.(data);
    (0, react_1.startTransition)(() => {
        // FIXME this causes rerenders even if data is empty
        fetchCache[SET_ELEMENTS]?.((prev) => mergeElements(prev, data));
    });
    return (await data)._value;
};
exports.callServerRSC = callServerRSC;
const prefetchedParams = new WeakMap();
const fetchRSCInternal = (url, params) => params === undefined
    ? (0, fetch_1.fetch)(url, {
        // Disable caching
        headers: {
            ...NO_CACHE_HEADERS,
            'expo-platform': process.env.EXPO_OS,
        },
    })
    : typeof params === 'string'
        ? (0, fetch_1.fetch)(url, {
            headers: {
                ...NO_CACHE_HEADERS,
                'expo-platform': process.env.EXPO_OS,
                'X-Expo-Params': params,
            },
        })
        : encodeReply(params).then((body) => (0, fetch_1.fetch)(url, { method: 'POST', headers: ACTION_HEADERS, body }));
const fetchRSC = (input, params, fetchCache = defaultFetchCache) => {
    // TODO: strip when "is exporting".
    if (process.env.NODE_ENV === 'development') {
        const refetchRsc = () => {
            delete fetchCache[ENTRY];
            const data = (0, exports.fetchRSC)(input, params, fetchCache);
            fetchCache[SET_ELEMENTS]?.(() => data);
        };
        globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
        const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__EXPO_REFETCH_RSC__);
        if (index !== -1) {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRsc);
        }
        else {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.push(refetchRsc);
        }
        globalThis.__EXPO_REFETCH_RSC__ = refetchRsc;
    }
    const entry = fetchCache[ENTRY];
    if (entry && entry[0] === input && entry[1] === params) {
        return entry[2];
    }
    // eslint-disable-next-line no-multi-assign
    const prefetched = (globalThis.__EXPO_PREFETCHED__ ||= {});
    // TODO: Load from on-disk on native when indicated.
    // const reqPath = fetchOptions?.remote ? getAdjustedRemoteFilePath(url) : getAdjustedRemoteFilePath(url);
    const url = getAdjustedRemoteFilePath(BASE_PATH + (0, utils_1.encodeInput)(input));
    const hasValidPrefetchedResponse = !!prefetched[url] &&
        // HACK .has() is for the initial hydration
        // It's limited and may result in a wrong result. FIXME
        (!prefetchedParams.has(prefetched[url]) || prefetchedParams.get(prefetched[url]) === params);
    const response = hasValidPrefetchedResponse ? prefetched[url] : fetchRSCInternal(url, params);
    delete prefetched[url];
    const data = createFromFetch(checkStatus(response), {
        callServer: (actionId, args) => (0, exports.callServerRSC)(actionId, args, fetchCache),
    });
    fetchCache[ON_FETCH_DATA]?.(data);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchCache[ENTRY] = [input, params, data];
    return data;
};
exports.fetchRSC = fetchRSC;
function getAdjustedRemoteFilePath(path) {
    if (IS_DOM && process.env.NODE_ENV === 'production') {
        const origin = (0, url_1.getOriginFromConstants)();
        if (!origin) {
            throw new Error('Expo RSC: Origin not found in Constants. This is required for production DOM components using server actions.');
        }
        // DOM components in production need to use the same origin logic as native.
        return new URL(path, origin).toString();
    }
    if (!IS_DOM && process.env.EXPO_OS === 'web') {
        return path;
    }
    return new URL(path, window.location.href).toString();
}
const prefetchRSC = (input, params) => {
    // eslint-disable-next-line no-multi-assign
    const prefetched = (globalThis.__EXPO_PREFETCHED__ ||= {});
    const url = getAdjustedRemoteFilePath(BASE_PATH + (0, utils_1.encodeInput)(input));
    if (!(url in prefetched)) {
        prefetched[url] = fetchRSCInternal(url, params);
        prefetchedParams.set(prefetched[url], params);
    }
};
exports.prefetchRSC = prefetchRSC;
const RefetchContext = (0, react_1.createContext)(() => {
    throw new Error('Missing Root component');
});
const ElementsContext = (0, react_1.createContext)(null);
const Root = ({ initialInput, initialParams, fetchCache = defaultFetchCache, unstable_onFetchData, children, }) => {
    fetchCache[ON_FETCH_DATA] = unstable_onFetchData;
    const [elements, setElements] = (0, react_1.useState)(() => (0, exports.fetchRSC)(initialInput || '', initialParams, fetchCache));
    (0, react_1.useEffect)(() => {
        fetchCache[SET_ELEMENTS] = setElements;
    }, [fetchCache, setElements]);
    const refetch = (0, react_1.useCallback)((input, params) => {
        // clear cache entry before fetching
        delete fetchCache[ENTRY];
        const data = (0, exports.fetchRSC)(input, params, fetchCache);
        (0, react_1.startTransition)(() => {
            setElements((prev) => mergeElements(prev, data));
        });
    }, [fetchCache]);
    return (0, react_1.createElement)(RefetchContext.Provider, { value: refetch }, (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children));
};
exports.Root = Root;
const useRefetch = () => (0, react_1.use)(RefetchContext);
exports.useRefetch = useRefetch;
const ChildrenContext = (0, react_1.createContext)(undefined);
const ChildrenContextProvider = (0, react_1.memo)(ChildrenContext.Provider);
const Slot = ({ id, children, fallback, }) => {
    const elementsPromise = (0, react_1.use)(ElementsContext);
    if (!elementsPromise) {
        throw new Error('Missing Root component');
    }
    const elements = (0, react_1.use)(elementsPromise);
    if (!(id in elements)) {
        if (fallback) {
            return fallback;
        }
        throw new Error('Not found: ' + id + '. Expected: ' + Object.keys(elements).join(', '));
    }
    return (0, react_1.createElement)(ChildrenContextProvider, { value: children }, elements[id]);
};
exports.Slot = Slot;
const Children = () => (0, react_1.use)(ChildrenContext);
exports.Children = Children;
/**
 * ServerRoot for SSR
 * This is not a public API.
 */
const ServerRoot = ({ elements, children }) => (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children);
exports.ServerRoot = ServerRoot;
//# sourceMappingURL=host.js.map