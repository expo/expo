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
exports.getManifest = exports.getStaticContent = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
require("@expo/metro-runtime");
const native_1 = require("@react-navigation/native");
const Font = __importStar(require("expo-font/build/server"));
const react_1 = __importDefault(require("react"));
const server_1 = __importDefault(require("react-dom/server"));
const react_native_web_1 = require("react-native-web");
const getRootComponent_1 = require("./getRootComponent");
const _ctx_1 = require("../../_ctx");
const ExpoRoot_1 = require("../ExpoRoot");
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
const head_1 = require("../head");
const loadStaticParamsAsync_1 = require("../loadStaticParamsAsync");
react_native_web_1.AppRegistry.registerComponent('App', () => ExpoRoot_1.ExpoRoot);
/** Get the linking manifest from a Node.js process. */
async function getManifest(options) {
    const routeTree = (0, getRoutes_1.getRoutes)(_ctx_1.ctx, options);
    if (!routeTree) {
        throw new Error('No routes found');
    }
    // Evaluate all static params
    await (0, loadStaticParamsAsync_1.loadStaticParamsAsync)(routeTree);
    return (0, getLinkingConfig_1.getNavigationConfig)(routeTree);
}
exports.getManifest = getManifest;
function resetReactNavigationContexts() {
    // https://github.com/expo/router/discussions/588
    // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1
    // React Navigation is storing providers in a global, this is fine for the first static render
    // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
    const contexts = '__react_navigation__elements_contexts';
    global[contexts] = new Map();
}
function getStaticContent(location) {
    const headContext = {};
    const ref = react_1.default.createRef();
    const { 
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element, getStyleElement, } = react_native_web_1.AppRegistry.getApplication('App', {
        initialProps: {
            location,
            context: _ctx_1.ctx,
            wrapper: ({ children }) => (react_1.default.createElement(Root, null,
                react_1.default.createElement("div", { id: "root" }, children))),
        },
    });
    const Root = (0, getRootComponent_1.getRootComponent)();
    // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
    // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
    Font.resetServerContext();
    // This MUST be run before `ReactDOMServer.renderToString` to prevent
    // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
    resetReactNavigationContexts();
    const html = server_1.default.renderToString(react_1.default.createElement(head_1.Head.Provider, { context: headContext },
        react_1.default.createElement(native_1.ServerContainer, { ref: ref }, element)));
    // Eval the CSS after the HTML is rendered so that the CSS is in the same order
    const css = server_1.default.renderToStaticMarkup(getStyleElement());
    let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
    output = output.replace('</head>', `${css}</head>`);
    // Inject static fonts loaded with expo-font
    output = output.replace('</head>', `${Font.getServerResources().join('')}</head>`);
    return '<!DOCTYPE html>' + output;
}
exports.getStaticContent = getStaticContent;
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
//# sourceMappingURL=renderStaticContent.js.map