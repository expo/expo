"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "findWorkspaceRoot", {
  enumerable: true,
  get: function () {
    return _resolveWorkspaceRoot().resolveWorkspaceRoot;
  }
});
Object.defineProperty(exports, "findWorkspaceRootAsync", {
  enumerable: true,
  get: function () {
    return _resolveWorkspaceRoot().resolveWorkspaceRootAsync;
  }
});
function _resolveWorkspaceRoot() {
  const data = require("resolve-workspace-root");
  _resolveWorkspaceRoot = function () {
    return data;
  };
  return data;
}
//# sourceMappingURL=workspaces.js.map