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
exports.getBuildTimeServerManifestAsync = exports.getManifest = exports.getStaticContent = void 0;
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
const server_node_1 = __importDefault(require("react-dom/server.node"));
const react_native_web_1 = require("react-native-web");
const getRootComponent_1 = require("./getRootComponent");
const _ctx_1 = require("../../_ctx");
const ExpoRoot_1 = require("../ExpoRoot");
const getReactNavigationConfig_1 = require("../getReactNavigationConfig");
const getRoutes_1 = require("../getRoutes");
const head_1 = require("../head");
const loadStaticParamsAsync_1 = require("../loadStaticParamsAsync");
const debug = require('debug')('expo:router:renderStaticContent');
/** Get the linking manifest from a Node.js process. */
async function getManifest(options = {}) {
    const routeTree = (0, getRoutes_1.getRoutes)(_ctx_1.ctx, {
        preserveApiRoutes: true,
        platform: 'web',
        ...options,
    });
    if (!routeTree) {
        throw new Error('No routes found');
    }
    // Evaluate all static params
    await (0, loadStaticParamsAsync_1.loadStaticParamsAsync)(routeTree);
    return (0, getReactNavigationConfig_1.getReactNavigationConfig)(routeTree, false);
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
async function getStaticContent(location) {
    const headContext = {};
    const ref = react_1.default.createRef();
    const Root = (0, getRootComponent_1.getRootComponent)();
    function Main() {
        return (<ExpoRoot_1.ExpoRoot location={location} context={_ctx_1.ctx} wrapper={({ children }) => (<Root>
            <div id="root">{children}</div>
          </Root>)}/>);
    }
    // Based on the legacy implementation in `@expo/next-adapter` for parity until we have server components.
    const getInitialProps = Root.getInitialProps ||
        (async ({ renderPage }) => {
            // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
            // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
            Font.resetServerContext();
            // This MUST be run before `ReactDOMServer.renderToString` to prevent
            // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
            resetReactNavigationContexts();
            react_native_web_1.AppRegistry.registerComponent('main', () => Main);
            const { getStyleElement } = react_native_web_1.AppRegistry.getApplication('main');
            const page = await renderPage();
            const styles = [getStyleElement()];
            return { ...page, styles: react_1.default.Children.toArray(styles) };
        });
    const { styles, ...initialProps } = await getInitialProps({
        renderPage() {
            return { children: <Main /> };
        },
    });
    const html = await server_node_1.default.renderToString(<head_1.Head.Provider context={headContext}>
      <native_1.ServerContainer ref={ref} {...initialProps}/>
    </head_1.Head.Provider>);
    // Eval the CSS after the HTML is rendered so that the CSS is in the same order
    const css = server_node_1.default.renderToStaticMarkup(styles);
    let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
    output = output.replace('</head>', `${css}</head>`);
    // TODO: Make this use React JSX in the future to unify with other server-based styling libraries.
    const fonts = Font.getServerResources();
    debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
    // Inject static fonts loaded with expo-font
    output = output.replace('</head>', `${fonts.join('')}</head>`);
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
var getServerManifest_1 = require("./getServerManifest");
Object.defineProperty(exports, "getBuildTimeServerManifestAsync", { enumerable: true, get: function () { return getServerManifest_1.getBuildTimeServerManifestAsync; } });
//# sourceMappingURL=renderStaticContent.js.map