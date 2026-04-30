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
exports.getManifest = exports.getBuildTimeServerManifestAsync = exports.resolveMetadata = exports.getStreamingContent = void 0;
exports.getStaticContent = getStaticContent;
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
const static_1 = require("expo-router/internal/static");
const server_1 = __importDefault(require("react-dom/server"));
const getRootComponent_1 = require("./getRootComponent");
const debug_1 = require("../utils/debug");
const html_1 = require("../utils/html");
const debug = (0, debug_1.createDebug)('expo:router:server:renderStaticContent');
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
async function getStaticContent(location, options) {
    const { headContext, element, getStyleElement, loadedData } = prepareRenderContext(location, options);
    const html = server_1.default.renderToString((0, jsx_runtime_1.jsx)(head_1.default.Provider, { context: headContext, children: (0, jsx_runtime_1.jsx)(static_1.InnerRoot, { loadedData: loadedData, children: element }) }));
    // Eval the CSS after the HTML is rendered so that the CSS is in the same order
    const css = server_1.default.renderToStaticMarkup(getStyleElement());
    let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
    output = output.replace('</head>', `${css}</head>`);
    const fonts = Font.getServerResources();
    debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
    // Inject static fonts loaded with expo-font
    output = output.replace('</head>', `${fonts.join('')}</head>`);
    if (loadedData) {
        output = output.replace('</head>', `${(0, html_1.createLoaderDataScriptAsString)(loadedData)}</head>`);
    }
    // Inject hydration assets (JS/CSS bundles). Used in SSR mode
    if (options?.assets) {
        if (options.assets.css.length > 0) {
            const injectedCSS = (0, html_1.createInjectedCssAsString)(options.assets.css);
            output = output.replace('</head>', `${injectedCSS}\n</head>`);
        }
        if (options.assets.js.length > 0) {
            // In non-streaming mode, use deferred scripts in the body
            output = output.replace('</body>', `${(0, html_1.createInjectedScriptsAsString)(options.assets.js)}\n</body>`);
        }
    }
    return '<!DOCTYPE html>' + output;
}
function mixHeadComponentsWithStaticResults(helmet, html) {
    const { headTags, htmlAttributes, bodyAttributes } = (0, html_1.serializeHelmetToHtml)(helmet);
    if (headTags) {
        html = html.replace('<head>', `<head>${headTags}`);
    }
    // attributes
    html = html.replace('<html ', `<html ${htmlAttributes} `);
    html = html.replace('<body ', `<body ${bodyAttributes} `);
    return html;
}
// Re-export for use in server
var renderStreamingContent_1 = require("../server/renderStreamingContent");
Object.defineProperty(exports, "getStreamingContent", { enumerable: true, get: function () { return renderStreamingContent_1.getStreamingContent; } });
Object.defineProperty(exports, "resolveMetadata", { enumerable: true, get: function () { return renderStreamingContent_1.resolveMetadata; } });
var getServerManifest_1 = require("./getServerManifest");
Object.defineProperty(exports, "getBuildTimeServerManifestAsync", { enumerable: true, get: function () { return getServerManifest_1.getBuildTimeServerManifestAsync; } });
Object.defineProperty(exports, "getManifest", { enumerable: true, get: function () { return getServerManifest_1.getManifest; } });
//# sourceMappingURL=renderStaticContent.js.map