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
exports.getManifest = exports.getBuildTimeServerManifestAsync = void 0;
exports.getStaticContent = getStaticContent;
/**
 * Copyright © 2023 650 Industries.
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
const react_1 = __importDefault(require("react"));
const server_node_1 = __importDefault(require("react-dom/server.node"));
const getRootComponent_1 = require("./getRootComponent");
const html_1 = require("./html");
const debug_1 = require("../utils/debug");
const debug = (0, debug_1.createDebug)('expo:router:server:renderStaticContent');
function resetReactNavigationContexts() {
    // https://github.com/expo/router/discussions/588
    // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1
    // React Navigation is storing providers in a global, this is fine for the first static render
    // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
    const contexts = '__react_navigation__elements_contexts';
    globalThis[contexts] = new Map();
}
async function getStaticContent(location, options) {
    const headContext = {};
    const Root = (0, getRootComponent_1.getRootComponent)();
    const { 
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element, getStyleElement, } = (0, static_1.registerStaticRootComponent)(expo_router_1.ExpoRoot, {
        location,
        context: _ctx_1.ctx,
        wrapper: ({ children }) => (<Root>
        <div id="root">{children}</div>
      </Root>),
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
    const html = server_node_1.default.renderToString(<head_1.default.Provider context={headContext}>
      <static_1.InnerRoot loadedData={loadedData}>{element}</static_1.InnerRoot>
    </head_1.default.Provider>);
    // Eval the CSS after the HTML is rendered so that the CSS is in the same order
    const css = server_node_1.default.renderToStaticMarkup(getStyleElement());
    let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
    output = output.replace('</head>', `${css}</head>`);
    const fonts = Font.getServerResources();
    debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
    // debug('Push static fonts:', fonts)
    // Inject static fonts loaded with expo-font
    output = output.replace('</head>', `${fonts.join('')}</head>`);
    if (loadedData) {
        const loaderDataScript = server_node_1.default.renderToStaticMarkup(<html_1.PreloadedDataScript data={loadedData}/>);
        output = output.replace('</head>', `${loaderDataScript}</head>`);
    }
    // Inject hydration assets (JS/CSS bundles). Used in SSR mode
    if (options?.assets) {
        if (options.assets.css.length > 0) {
            /**
             * For each CSS file, inject two link elements; one for preloading and one as the actual
             * stylesheet. This matches what we do for SSG
             *
             * @see @expo/cli/src/start/server/metro/serializeHtml.ts
             */
            const injectedCSS = options.assets.css
                .flatMap((href) => [
                `<link rel="preload" href="${href}" as="style">`,
                `<link rel="stylesheet" href="${href}">`,
            ])
                .join('\n');
            output = output.replace('</head>', `${injectedCSS}\n</head>`);
        }
        if (options.assets.js.length > 0) {
            const injectedJS = options.assets.js
                .map((src) => `<script src="${src}" defer></script>`)
                .join('\n');
            output = output.replace('</body>', `${injectedJS}\n</body>`);
        }
    }
    return '<!DOCTYPE html>' + output;
}
function mixHeadComponentsWithStaticResults(helmet, html) {
    // Head components
    for (const key of ['title', 'priority', 'meta', 'link', 'script', 'style'].reverse()) {
        const result = helmet?.[key]?.toString();
        if (result) {
            html = html.replace('<head>', `<head>${result}`);
        }
    }
    // attributes
    html = html.replace('<html ', `<html ${helmet?.htmlAttributes.toString()} `);
    html = html.replace('<body ', `<body ${helmet?.bodyAttributes.toString()} `);
    return html;
}
// Re-export for use in server
var getServerManifest_1 = require("./getServerManifest");
Object.defineProperty(exports, "getBuildTimeServerManifestAsync", { enumerable: true, get: function () { return getServerManifest_1.getBuildTimeServerManifestAsync; } });
Object.defineProperty(exports, "getManifest", { enumerable: true, get: function () { return getServerManifest_1.getManifest; } });
//# sourceMappingURL=renderStaticContent.js.map