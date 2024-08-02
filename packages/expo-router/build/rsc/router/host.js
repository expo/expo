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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRoot = exports.Children = exports.Slot = exports.useRefetch = exports.Root = exports.prefetchRSC = exports.fetchRSC = void 0;
const FS = __importStar(require("expo-file-system"));
const react_1 = require("react");
const client_1 = __importDefault(require("react-server-dom-webpack/client"));
const errors_1 = require("./errors");
const fetch_1 = require("./fetch");
const getDevServer_1 = require("../../getDevServer");
const { createFromFetch, encodeReply } = client_1.default;
// NOTE: Ensured to start with `/`.
const RSC_PATH = '/_flight'; // process.env.EXPO_RSC_PATH;
let BASE_PATH = `${process.env.EXPO_BASE_URL}${RSC_PATH}`;
if (!BASE_PATH.startsWith('/')) {
    BASE_PATH = '/' + BASE_PATH;
}
if (!BASE_PATH.endsWith('/')) {
    BASE_PATH += '/';
}
if (BASE_PATH === '/') {
    throw new Error(`Invalid React Flight path "${BASE_PATH}". The path should not live at the project root, e.g. /_flight/. Dev server URL: ${(0, getDevServer_1.getDevServer)().fullBundleUrl}`);
}
const checkStatus = async (responsePromise) => {
    // TODO: Combine with metro async fetch logic.
    const response = await responsePromise;
    if (!response.ok) {
        // NOTE(EvanBacon): Transform the Metro development error into a JS error that can be used by LogBox.
        // This was tested against using a Class component in a server component.
        if (response.status === 500) {
            const errorText = await response.text();
            let errorJson;
            try {
                errorJson = JSON.parse(errorText);
            }
            catch {
                throw new errors_1.ReactServerError(errorText, response.url, response.status);
            }
            // TODO: This should be a dev-only error. Add handling for production equivalent.
            throw new errors_1.MetroServerError(errorJson, response.url);
        }
        let responseText;
        try {
            responseText = await response.text();
        }
        catch {
            throw new errors_1.ReactServerError(response.statusText, response.url, response.status);
        }
        throw new errors_1.ReactServerError(responseText, response.url, response.status);
    }
    console.log('[Router] Fetched', response.url, response.status);
    return response;
};
function getCached(c, m, k) {
    return (m.has(k) ? m : m.set(k, c())).get(k);
}
const cache1 = new WeakMap();
const mergeElements = (a, b) => {
    const getResult = async () => {
        const nextElements = { ...(await a), ...(await b) };
        delete nextElements._value;
        return nextElements;
    };
    const cache2 = getCached(() => new WeakMap(), cache1, a);
    return getCached(getResult, cache2, b);
};
const fetchCache = [];
const RSC_CONTENT_TYPE = 'text/x-component';
const fetchRSC = (input, searchParamsString, setElements, cache = fetchCache, unstable_onFetchData, fetchOptions) => {
    // TODO: strip when "is exporting".
    if (process.env.NODE_ENV === 'development') {
        const refetchRsc = () => {
            cache.splice(0);
            const data = (0, exports.fetchRSC)(input, searchParamsString, setElements, cache, unstable_onFetchData, {
                remote: true,
            });
            setElements(data);
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
    let entry = cache[0];
    if (entry && entry[0] === input && entry[1] === searchParamsString) {
        entry[2] = setElements;
        return entry[3];
    }
    const options = {
        async callServer(actionId, args) {
            console.log('[Router] Server Action invoked:', actionId);
            const reqPath = getAdjustedRemoteFilePath(BASE_PATH + encodeInput(encodeURIComponent(actionId)));
            let requestOpts;
            if (!Array.isArray(args) || args.some((a) => a instanceof FormData)) {
                requestOpts = {
                    headers: { accept: RSC_CONTENT_TYPE },
                    body: await encodeReply(args),
                };
            }
            else {
                requestOpts = {
                    headers: {
                        accept: RSC_CONTENT_TYPE,
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify(args),
                };
            }
            const response = (0, fetch_1.fetch)(reqPath, {
                method: 'POST',
                // @ts-expect-error: non-standard feature for streaming.
                duplex: 'half',
                reactNative: { textStreaming: true },
                ...requestOpts,
                headers: {
                    ...requestOpts.headers,
                    'expo-platform': process.env.EXPO_OS,
                },
            });
            const data = createFromFetch(checkStatus(response), options);
            const setElements = entry[2];
            (0, react_1.startTransition)(() => {
                // FIXME this causes rerenders even if data is empty
                setElements((prev) => mergeElements(prev, data));
            });
            const fullRes = await data;
            console.log('[Router] Server Action resolved:', fullRes._value);
            return fullRes._value;
        },
    };
    // eslint-disable-next-line no-multi-assign
    const prefetched = (globalThis.__EXPO_PREFETCHED__ ||= {});
    const url = BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : '');
    const reqPath = fetchOptions?.remote ? getAdjustedRemoteFilePath(url) : getAdjustedFilePath(url);
    console.log('fetch', reqPath);
    const response = prefetched[url] ||
        (0, fetch_1.fetch)(reqPath, {
            headers: {
                'expo-platform': process.env.EXPO_OS,
            },
            // @ts-expect-error: TODO: Add expo streaming fetch
            reactNative: { textStreaming: true },
        });
    delete prefetched[url];
    const data = createFromFetch(checkStatus(response), options);
    unstable_onFetchData?.(data);
    // eslint-disable-next-line no-multi-assign
    cache[0] = entry = [input, searchParamsString, setElements, data];
    return data;
};
exports.fetchRSC = fetchRSC;
function getAdjustedRemoteFilePath(path) {
    if (process.env.EXPO_OS === 'web') {
        return path;
    }
    return new URL(path, window.location.href).toString();
}
function getAdjustedFilePath(path) {
    if (process.env.EXPO_OS === 'web') {
        return path;
    }
    // Server actions should be fetched from the server every time.
    if (path.match(/[0-9a-z]{40}#/i)) {
        return getAdjustedRemoteFilePath(path);
    }
    if ((0, getDevServer_1.getDevServer)().bundleLoadedFromServer) {
        return getAdjustedRemoteFilePath(path);
    }
    if (process.env.EXPO_OS === 'android') {
        return 'file:///android_asset' + path;
    }
    return 'file://' + FS.bundleDirectory + path;
}
const prefetchRSC = (input, searchParamsString) => {
    // eslint-disable-next-line no-multi-assign
    const prefetched = (globalThis.__EXPO_PREFETCHED__ ||= {});
    const url = getAdjustedFilePath(BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : ''));
    if (!(url in prefetched)) {
        prefetched[url] = (0, fetch_1.fetch)(url, {
            headers: {
                'expo-platform': process.env.EXPO_OS,
            },
            // @ts-expect-error: non-standard feature for streaming.
            reactNative: { textStreaming: true },
        });
    }
};
exports.prefetchRSC = prefetchRSC;
const RefetchContext = (0, react_1.createContext)(() => {
    throw new Error('Missing Root component');
});
const ElementsContext = (0, react_1.createContext)(null);
const Root = ({ initialInput, initialSearchParamsString, cache, unstable_onFetchData, children, }) => {
    const [elements, setElements] = (0, react_1.useState)(() => (0, exports.fetchRSC)(initialInput || '', initialSearchParamsString || '', (fn) => setElements(fn), cache, unstable_onFetchData));
    const refetch = (0, react_1.useCallback)((input, searchParams) => {
        (cache || fetchCache).splice(0); // clear cache before fetching
        const data = (0, exports.fetchRSC)(input, searchParams?.toString() || '', setElements, cache, unstable_onFetchData, { remote: true });
        setElements((prev) => mergeElements(prev, data));
    }, [cache, unstable_onFetchData]);
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
const encodeInput = (input) => {
    if (input === '') {
        return 'index.txt';
    }
    if (input === 'index') {
        throw new Error('Input should not be `index`');
    }
    if (input.startsWith('/')) {
        throw new Error('Input should not start with `/`');
    }
    if (input.endsWith('/')) {
        throw new Error('Input should not end with `/`');
    }
    return input + '.txt';
};
//# sourceMappingURL=host.js.map