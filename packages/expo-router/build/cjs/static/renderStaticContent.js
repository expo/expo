"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildTimeServerManifestAsync = getBuildTimeServerManifestAsync;
exports.getManifest = getManifest;
exports.getStaticContent = getStaticContent;
require("@expo/metro-runtime");
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function Font() {
  const data = _interopRequireWildcard(require("expo-font/build/server"));
  Font = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _server2() {
  const data = _interopRequireDefault(require("react-dom/server.node"));
  _server2 = function () {
    return data;
  };
  return data;
}
function _AppRegistry() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/AppRegistry"));
  _AppRegistry = function () {
    return data;
  };
  return data;
}
function _getRootComponent() {
  const data = require("./getRootComponent");
  _getRootComponent = function () {
    return data;
  };
  return data;
}
function _ctx() {
  const data = require("../../_ctx");
  _ctx = function () {
    return data;
  };
  return data;
}
function _ExpoRoot() {
  const data = require("../ExpoRoot");
  _ExpoRoot = function () {
    return data;
  };
  return data;
}
function _getReactNavigationConfig() {
  const data = require("../getReactNavigationConfig");
  _getReactNavigationConfig = function () {
    return data;
  };
  return data;
}
function _getRoutes() {
  const data = require("../getRoutes");
  _getRoutes = function () {
    return data;
  };
  return data;
}
function _getServerManifest() {
  const data = require("../getServerManifest");
  _getServerManifest = function () {
    return data;
  };
  return data;
}
function _head() {
  const data = require("../head");
  _head = function () {
    return data;
  };
  return data;
}
function _loadStaticParamsAsync() {
  const data = require("../loadStaticParamsAsync");
  _loadStaticParamsAsync = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const debug = require('debug')('expo:router:renderStaticContent');
_AppRegistry().default.registerComponent('App', () => _ExpoRoot().ExpoRoot);

/** Get the linking manifest from a Node.js process. */
async function getManifest(options = {}) {
  const routeTree = (0, _getRoutes().getRoutes)(_ctx().ctx, {
    preserveApiRoutes: true,
    ...options
  });
  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await (0, _loadStaticParamsAsync().loadStaticParamsAsync)(routeTree);
  return (0, _getReactNavigationConfig().getReactNavigationConfig)(routeTree, false);
}

/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
async function getBuildTimeServerManifestAsync(options = {}) {
  const routeTree = (0, _getRoutes().getRoutes)(_ctx().ctx, options);
  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await (0, _loadStaticParamsAsync().loadStaticParamsAsync)(routeTree);
  return (0, _getServerManifest().getServerManifest)(routeTree);
}
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
  const ref = /*#__PURE__*/_react().default.createRef();
  const {
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element,
    getStyleElement
  } = _AppRegistry().default.getApplication('App', {
    initialProps: {
      location,
      context: _ctx().ctx,
      wrapper: ({
        children
      }) => /*#__PURE__*/_react().default.createElement(Root, null, /*#__PURE__*/_react().default.createElement("div", {
        id: "root"
      }, children))
    }
  });
  const Root = (0, _getRootComponent().getRootComponent)();

  // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
  // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
  Font().resetServerContext();

  // This MUST be run before `ReactDOMServer.renderToString` to prevent
  // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
  resetReactNavigationContexts();
  const stream = await _server2().default.renderToStaticNodeStream( /*#__PURE__*/_react().default.createElement(_head().Head.Provider, {
    context: headContext
  }, /*#__PURE__*/_react().default.createElement(_native().ServerContainer, {
    ref: ref
  }, element)));
  let html = '';
  for await (const chunk of stream) {
    html += chunk;
  }

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = _server2().default.renderToStaticMarkup(getStyleElement());
  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);
  output = output.replace('</head>', `${css}</head>`);
  const fonts = Font().getServerResources();
  debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
  // debug('Push static fonts:', fonts)
  // Inject static fonts loaded with expo-font
  output = output.replace('</head>', `${fonts.join('')}</head>`);
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
//# sourceMappingURL=renderStaticContent.js.map