"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.importMetroConfigFromProject = importMetroConfigFromProject;
exports.importMetroSourceMapFromProject = importMetroSourceMapFromProject;
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class MetroImportError extends Error {
  constructor(projectRoot, moduleId) {
    super(`Missing package "${moduleId}" in the project at: ${projectRoot}\n` + 'This usually means `react-native` is not installed. ' + 'Please verify that dependencies in package.json include "react-native" ' + 'and run `yarn` or `npm install`.');
  }
}
function resolveFromProject(projectRoot, moduleId) {
  const resolvedPath = _resolveFrom().default.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}
function importFromProject(projectRoot, moduleId) {
  return require(resolveFromProject(projectRoot, moduleId));
}
function importMetroConfigFromProject(projectRoot) {
  return importFromProject(projectRoot, 'metro-config');
}
let metroSourceMap;
function importMetroSourceMapFromProject(projectRoot) {
  if (metroSourceMap) return metroSourceMap;
  metroSourceMap = importFromProject(projectRoot, 'metro-source-map');
  return metroSourceMap;
}
//# sourceMappingURL=importMetroFromProject.js.map