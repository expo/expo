"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getModulesPaths = getModulesPaths;
exports.getServerRoot = getServerRoot;
exports.getWorkspaceRoot = getWorkspaceRoot;
function _findYarnWorkspaceRoot() {
  const data = _interopRequireDefault(require("find-yarn-workspace-root"));
  _findYarnWorkspaceRoot = function () {
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
function _env() {
  const data = require("./env");
  _env = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/** Wraps `findWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
function getWorkspaceRoot(projectRoot) {
  try {
    return (0, _findYarnWorkspaceRoot().default)(projectRoot);
  } catch (error) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}
function getModulesPaths(projectRoot) {
  const paths = [];

  // Only add the project root if it's not the current working directory
  // this minimizes the chance of Metro resolver breaking on new Node.js versions.
  const workspaceRoot = getWorkspaceRoot(_path().default.resolve(projectRoot)); // Absolute path or null
  if (workspaceRoot) {
    paths.push(_path().default.resolve(projectRoot));
    paths.push(_path().default.resolve(workspaceRoot, 'node_modules'));
  }
  return paths;
}
function getServerRoot(projectRoot) {
  var _getWorkspaceRoot;
  return _env().env.EXPO_USE_METRO_WORKSPACE_ROOT ? (_getWorkspaceRoot = getWorkspaceRoot(projectRoot)) !== null && _getWorkspaceRoot !== void 0 ? _getWorkspaceRoot : projectRoot : projectRoot;
}
//# sourceMappingURL=getModulesPaths.js.map