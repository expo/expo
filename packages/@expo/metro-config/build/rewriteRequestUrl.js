"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRewriteRequestUrl = getRewriteRequestUrl;
function _config() {
  const data = require("@expo/config");
  _config = function () {
    return data;
  };
  return data;
}
function _paths() {
  const data = require("@expo/config/paths");
  _paths = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _getModulesPaths() {
  const data = require("./getModulesPaths");
  _getModulesPaths = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Copyright 2023-present 650 Industries (Expo). All rights reserved.

const debug = require('debug')('expo:metro:config:rewriteRequestUrl');
function getRewriteRequestUrl(projectRoot) {
  function rewriteExpoRequestUrl(url) {
    // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
      var _searchParams$get;
      const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
      // TODO: Maybe this function could be memoized in some capacity?
      const {
        search,
        searchParams
      } = ensured;
      const platform = (_searchParams$get = searchParams.get('platform')) !== null && _searchParams$get !== void 0 ? _searchParams$get : 'web';
      debug('Rewriting magic request url to entry point', {
        url,
        platform
      });
      const entry = (0, _paths().resolveEntryPoint)(projectRoot, {
        platform,
        // @ts-ignore
        projectConfig: {
          pkg: (0, _config().getPackageJson)(projectRoot)
        }
      });
      if (!entry) {
        throw new Error((0, _chalk().default)`The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`);
      }
      const serverRoot = (0, _getModulesPaths().getServerRoot)(projectRoot);
      const relativeEntry = _path().default.relative(serverRoot, entry).replace(/\.[tj]sx?$/, '');
      debug('Resolved entry point', {
        entry,
        relativeEntry,
        serverRoot
      });

      // Only return the pathname when url is relative
      if (url.startsWith('/')) {
        // Like: `/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        return '/' + relativeEntry + '.bundle' + search;
      }

      // Modify the pathname within the URL and return the full URL
      ensured.pathname = '/' + relativeEntry + '.bundle';
      // Like: `http://localhost:19001/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
      return ensured.toString();
    }
    return url;
  }
  return rewriteExpoRequestUrl;
}
//# sourceMappingURL=rewriteRequestUrl.js.map