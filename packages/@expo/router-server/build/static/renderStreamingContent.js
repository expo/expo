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
require("@expo/metro-runtime");
const Font = __importStar(require("expo-font/build/server"));
const expo_router_1 = require("expo-router");
const _ctx_1 = require("expo-router/_ctx");
const head_1 = __importDefault(require("expo-router/head"));
const server_1 = require("expo-router/internal/server");
const static_1 = require("expo-router/internal/static");
const server_2 = __importDefault(require("react-dom/server"));
const getRootComponent_1 = require("./getRootComponent");
const debug_1 = require("../utils/debug");
const html_1 = require("../utils/html");
const debug = (0, debug_1.createDebug)('expo:router:server:renderStreamingContent');
function resetReactNavigationContexts() {
    // TODO(@hassankhan): Share this request-scoped setup with renderStaticContent.tsx.
    const contexts = '__react_navigation__elements_contexts';
    globalThis[contexts] = new Map();
}
function createStreamingBodyNodes(getStyleElement) {
    const descriptors = Font.getServerResourceDescriptors();
    debug(`Pushing static fonts: (count: ${descriptors.length})`, descriptors);
    return [getStyleElement(), ...(0, html_1.createFontResourceNodes)(descriptors)];
}
function createServerDocumentPayload(getStyleElement, options) {
    return {
        bodyNodes: createStreamingBodyNodes(getStyleElement),
        headNodes: [
            ...(options?.metadata?.headNodes ?? []),
            ...(0, html_1.createInjectedCssNodes)(options?.assets?.css ?? []),
        ],
    };
}
function createStreamingBootstrapScriptContent(loadedData) {
    const parts = [(0, html_1.getHydrationFlagScriptContents)()];
    if (loadedData) {
        parts.push((0, html_1.createLoaderDataScriptContents)(loadedData));
    }
    return parts.join('');
}
async function getStreamingContent(location, options) {
    Font.resetServerContext();
    resetReactNavigationContexts();
    const Root = (0, getRootComponent_1.getRootComponent)();
    // TODO(@hassankhan): Share loader-data shaping with renderStaticContent.tsx.
    const loaderKey = options?.loader ? options.loader.key + location.search : null;
    const loadedData = loaderKey
        ? {
            [loaderKey]: options?.loader?.data ?? null,
        }
        : null;
    const { element, getStyleElement } = (0, static_1.registerStaticRootComponent)(expo_router_1.ExpoRoot, {
        location,
        context: _ctx_1.ctx,
        wrapper: ({ children }) => ((0, jsx_runtime_1.jsx)(server_1.ServerDocument, { Root: Root, payload: createServerDocumentPayload(getStyleElement, options), children: (0, jsx_runtime_1.jsx)("div", { id: "root", children: children }) })),
    });
    // We're leaving <Head.Provider> in for now to prevent errors if users do use <Head> in their app;
    // we now log a warning to the console in development
    return server_2.default.renderToReadableStream((0, jsx_runtime_1.jsx)(head_1.default.Provider, { children: (0, jsx_runtime_1.jsx)(static_1.InnerRoot, { loadedData: loadedData, children: element }) }), {
        bootstrapScriptContent: createStreamingBootstrapScriptContent(loadedData),
        bootstrapScripts: options?.assets?.js,
        signal: options?.request?.signal,
    });
}
var resolve_1 = require("../utils/metadata/resolve");
Object.defineProperty(exports, "resolveMetadata", { enumerable: true, get: function () { return resolve_1.resolveMetadata; } });
//# sourceMappingURL=renderStreamingContent.js.map