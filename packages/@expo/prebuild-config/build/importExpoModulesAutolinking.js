"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.importExpoModulesAutolinking = importExpoModulesAutolinking;
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
function importExpoModulesAutolinking(projectRoot) {
  const autolinking = tryRequireExpoModulesAutolinking(projectRoot);
  assertAutolinkingCompatibility(autolinking);
  return autolinking;
}
function tryRequireExpoModulesAutolinking(projectRoot) {
  const expoPackageRoot = _resolveFrom().default.silent(projectRoot, 'expo/package.json');
  const autolinkingExportsPath = _resolveFrom().default.silent(expoPackageRoot ?? projectRoot, 'expo-modules-autolinking/exports');
  if (!autolinkingExportsPath) {
    throw new Error("Cannot find 'expo-modules-autolinking' package in your project, make sure that you have 'expo' package installed");
  }
  return require(autolinkingExportsPath);
}
function assertAutolinkingCompatibility(autolinking) {
  if ('resolveSearchPathsAsync' in autolinking && 'findModulesAsync' in autolinking) {
    return;
  }
  throw new Error("The 'expo-modules-autolinking' package has been found, but it seems to be incompatible with '@expo/prebuild-config'");
}
//# sourceMappingURL=importExpoModulesAutolinking.js.map