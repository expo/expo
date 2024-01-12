"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRewriteRequestUrl = getRewriteRequestUrl;
exports.getRouterDirectory = getRouterDirectory;
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
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
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
function directoryExistsSync(file) {
  try {
    var _fs$statSync$isDirect, _fs$statSync;
    return (_fs$statSync$isDirect = (_fs$statSync = _fs().default.statSync(file)) === null || _fs$statSync === void 0 ? void 0 : _fs$statSync.isDirectory()) !== null && _fs$statSync$isDirect !== void 0 ? _fs$statSync$isDirect : false;
  } catch {
    return false;
  }
}
function isEnableHermesManaged(expoConfig, platform) {
  switch (platform) {
    case 'android':
      {
        var _expoConfig$android$j, _expoConfig$android;
        return ((_expoConfig$android$j = (_expoConfig$android = expoConfig.android) === null || _expoConfig$android === void 0 ? void 0 : _expoConfig$android.jsEngine) !== null && _expoConfig$android$j !== void 0 ? _expoConfig$android$j : expoConfig.jsEngine) !== 'jsc';
      }
    case 'ios':
      {
        var _expoConfig$ios$jsEng, _expoConfig$ios;
        return ((_expoConfig$ios$jsEng = (_expoConfig$ios = expoConfig.ios) === null || _expoConfig$ios === void 0 ? void 0 : _expoConfig$ios.jsEngine) !== null && _expoConfig$ios$jsEng !== void 0 ? _expoConfig$ios$jsEng : expoConfig.jsEngine) !== 'jsc';
      }
    default:
      return false;
  }
}
function getRouterDirectoryModuleIdWithManifest(projectRoot, exp) {
  var _exp$extra$router$roo, _exp$extra, _exp$extra$router;
  return (_exp$extra$router$roo = (_exp$extra = exp.extra) === null || _exp$extra === void 0 ? void 0 : (_exp$extra$router = _exp$extra.router) === null || _exp$extra$router === void 0 ? void 0 : _exp$extra$router.root) !== null && _exp$extra$router$roo !== void 0 ? _exp$extra$router$roo : getRouterDirectory(projectRoot);
}
function getRouterDirectory(projectRoot) {
  // more specific directories first
  if (directoryExistsSync(_path().default.join(projectRoot, 'src/app'))) {
    debug('Using src/app as the root directory for Expo Router.');
    return 'src/app';
  }
  debug('Using app as the root directory for Expo Router.');
  return 'app';
}
function getRewriteRequestUrl(projectRoot) {
  function rewriteExpoRequestUrl(url) {
    // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
      var _searchParams$get;
      const {
        pkg,
        exp
      } = (0, _config().getConfig)(projectRoot, {
        skipSDKVersionRequirement: true
      });
      const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
      // TODO: Maybe this function could be memoized in some capacity?
      const {
        searchParams
      } = ensured;
      const platform = (_searchParams$get = searchParams.get('platform')) !== null && _searchParams$get !== void 0 ? _searchParams$get : 'web';
      debug('Rewriting magic request url to entry point', {
        url,
        platform
      });
      const entry = (0, _paths().resolveEntryPoint)(projectRoot, {
        platform,
        pkg
      });
      if (!entry) {
        throw new Error((0, _chalk().default)`The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`);
      }

      // Infer the missing transform properties to attempt to match the manifest request.
      // NOTE: Keep in sync with metroOptions.ts
      if (!ensured.searchParams.has('transform.routerRoot')) {
        ensured.searchParams.set('transform.routerRoot', getRouterDirectoryModuleIdWithManifest(projectRoot, exp));
      }
      if (!ensured.searchParams.has('transform.engine')) {
        const isHermesEnabled = isEnableHermesManaged(exp, platform);
        if (isHermesEnabled) {
          debug('Enabling Hermes for managed project');
          ensured.searchParams.set('transform.engine', 'hermes');
        }
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
        return '/' + relativeEntry + '.bundle?' + searchParams.toString();
      }

      // Modify the pathname within the URL and return the full URL
      ensured.pathname = '/' + relativeEntry + '.bundle';
      const outputUrl = ensured.toString();
      debug('Redirected:', outputUrl);
      // Like: `http://localhost:19001/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
      return outputUrl;
    }
    return url;
  }
  return rewriteExpoRequestUrl;
}
//# sourceMappingURL=rewriteRequestUrl.js.map