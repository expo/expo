"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpoSDKVersion = getExpoSDKVersion;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _Errors() {
  const data = require("./Errors");
  _Errors = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
function getExpoSDKVersion(projectRoot, exp = {}) {
  return exp?.sdkVersion ?? getExpoSDKVersionFromPackage(projectRoot);
}

/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
function getExpoSDKVersionFromPackage(projectRoot) {
  const packageJsonPath = _resolveFrom().default.silent(projectRoot, 'expo/package.json');
  if (!packageJsonPath) {
    throw new (_Errors().ConfigError)(`Cannot determine which native SDK version your project uses because the module \`expo\` is not installed. Please install it with \`yarn add expo\` and try again.`, 'MODULE_NOT_FOUND');
  }
  const expoPackageJson = _jsonFile().default.read(packageJsonPath, {
    json5: true
  });
  const {
    version: packageVersion
  } = expoPackageJson;
  if (!(typeof packageVersion === 'string')) {
    // This is technically impossible.
    throw new (_Errors().ConfigError)(`Cannot determine which native SDK version your project uses because the module \`expo\` has an invalid package.json (missing \`version\` field). Try reinstalling node modules and trying again.`, 'MODULE_NOT_FOUND');
  }
  const majorVersion = packageVersion.split('.').shift();
  return `${majorVersion}.0.0`;
}
//# sourceMappingURL=getExpoSDKVersion.js.map