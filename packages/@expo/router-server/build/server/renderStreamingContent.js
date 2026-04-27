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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMetadata = void 0;
exports.getStreamingContent = getStreamingContent;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// NOTE(@hassankhan): disable when this file is its own entrypoint
// import '@expo/metro-runtime';
const Font = __importStar(require("expo-font/build/server"));
const expo_router_1 = require("expo-router");
const _ctx_1 = require("expo-router/_ctx");
const head_1 = __importDefault(require("expo-router/head"));
const server_1 = require("expo-router/internal/server");
const static_1 = require("expo-router/internal/static");
const server_2 = __importDefault(require("react-dom/server"));
const getRootComponent_1 = require("../static/getRootComponent");
const debug_1 = require("../utils/debug");
const react_1 = require("../utils/react");
const debug = (0, debug_1.createDebug)('expo:router:server:renderStreamingContent');
function resetReactNavigationContexts() {
    // https://github.com/expo/router/discussions/588
    // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1
    // React Navigation is storing providers in a global, this is fine for the first static render
    // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
    const contexts = '__react_navigation__elements_contexts';
    globalThis[contexts] = new Map();
}
/**
 * Shared setup for both `getStaticContent()` and `getStreamingContent()`. Creates the React element
 * tree, resets server contexts, and computes loader data.
 */
function prepareRenderContext(location, options) {
    const headContext = {};
    const Root = (0, getRootComponent_1.getRootComponent)();
    const { 
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element, getStyleElement, } = (0, static_1.registerStaticRootComponent)(expo_router_1.ExpoRoot, {
        location,
        context: _ctx_1.ctx,
        wrapper: ({ children }) => ((0, jsx_runtime_1.jsx)(Root, { children: (0, jsx_runtime_1.jsx)("div", { id: "root", children: children }) })),
    });
    // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
    // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
    Font.resetServerContext();
    // This MUST be run before `ReactDOMServer.renderToString` to prevent
    // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
    resetReactNavigationContexts();
    const loaderKey = options?.loader ? options.loader.key + location.search : null;
    const loadedData = loaderKey
        ? {
            [loaderKey]: options?.loader?.data ?? null,
        }
        : null;
    return { headContext, element, getStyleElement, loadedData };
}
function FontResources() {
    const descriptors = Font.getServerResourceDescriptors();
    debug(`Pushing fonts: (count: ${descriptors.length})`, descriptors);
    return (0, react_1.createInjectedFontsAsNodes)(descriptors);
}
/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 */
async function getStreamingContent(location, options) {
    const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(location, options);
    const { headNodes: headCssNodes } = (0, react_1.createInjectedCssAsNodes)(options?.assets?.css ?? []);
    const serverDocumentData = {
        headNodes: [
            ...(options?.metadata?.headNodes ?? []),
            getStyleElement({ key: 'rnw-style-element' }),
            ...(headCssNodes ?? []),
        ],
        bodyNodes: [(0, jsx_runtime_1.jsx)(FontResources, {})],
    };
    return await server_2.default.renderToReadableStream((0, jsx_runtime_1.jsx)(server_1.ServerDocument, { data: serverDocumentData, children: (0, jsx_runtime_1.jsx)(head_1.default.Provider, { context: headContext, children: (0, jsx_runtime_1.jsx)(static_1.InnerRoot, { loadedData: loadedData, children: element }) }) }), {
        // TODO(@hassankhan): Experiment and see if we can calculate a better default
        // We're doubling the default here so non-JavaScript renders show some content
        progressiveChunkSize: 12800 * 2,
        bootstrapScriptContent: (0, react_1.getBootstrapContents)({ hydrate: true, loadedData }),
        bootstrapScripts: options?.assets?.js,
        signal: options?.request?.signal,
    });
}
var metadata_1 = require("./metadata");
Object.defineProperty(exports, "resolveMetadata", { enumerable: true, get: function () { return metadata_1.resolveMetadata; } });
//# sourceMappingURL=renderStreamingContent.js.map