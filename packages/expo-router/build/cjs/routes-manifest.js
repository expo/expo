"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Options", {
  enumerable: true,
  get: function () {
    return _getRoutes().Options;
  }
});
exports.createRoutesManifest = createRoutesManifest;
function _getRoutes() {
  const data = require("./getRoutes");
  _getRoutes = function () {
    return data;
  };
  return data;
}
function _getServerManifest() {
  const data = require("./getServerManifest");
  _getServerManifest = function () {
    return data;
  };
  return data;
}
// This file runs in Node.js environments.
// no relative imports

function createMockContextModule(map = []) {
  const contextModule = key => ({
    default() {}
  });
  Object.defineProperty(contextModule, 'keys', {
    value: () => map
  });
  return contextModule;
}
function createRoutesManifest(paths, options) {
  // TODO: Drop this part for Node.js
  const routeTree = (0, _getRoutes().getRoutes)(createMockContextModule(paths), {
    ...options,
    preserveApiRoutes: true,
    ignoreRequireErrors: true,
    ignoreEntryPoints: true,
    platform: 'web'
  });
  if (!routeTree) {
    return null;
  }
  return (0, _getServerManifest().getServerManifest)(routeTree);
}
//# sourceMappingURL=routes-manifest.js.map