"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findWorkspaceRoot = findWorkspaceRoot;
function _findYarnWorkspaceRoot() {
  const data = _interopRequireDefault(require("find-yarn-workspace-root"));
  _findYarnWorkspaceRoot = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
function findWorkspaceRoot(projectRoot) {
  try {
    return (0, _findYarnWorkspaceRoot().default)(projectRoot);
  } catch (error) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}
//# sourceMappingURL=workspaces.js.map