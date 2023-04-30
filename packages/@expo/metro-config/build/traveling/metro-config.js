"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.importMetroConfig = importMetroConfig;
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// This package needs to be imported from within the project to

// ensure that Metro can bundle the project's assets (see: `watchFolders`).
function importMetroConfig(projectRoot) {
  const modulePath = _resolveFrom().default.silent(projectRoot, 'metro-config');
  if (!modulePath) {
    return require('metro-config');
  }
  return require(modulePath);
}
//# sourceMappingURL=metro-config.js.map