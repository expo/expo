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

function getExpoSDKVersion(projectRoot, exp) {
  if (exp !== null && exp !== void 0 && exp.sdkVersion) {
    return exp.sdkVersion;
  }

  const packageJsonPath = _resolveFrom().default.silent(projectRoot, 'expo/package.json');

  if (packageJsonPath) {
    const expoPackageJson = _jsonFile().default.read(packageJsonPath, {
      json5: true
    });

    const {
      version: packageVersion
    } = expoPackageJson;

    if (typeof packageVersion === 'string') {
      const majorVersion = packageVersion.split('.').shift();
      return `${majorVersion}.0.0`;
    }
  }

  throw new (_Errors().ConfigError)(`Cannot determine which native SDK version your project uses because the module \`expo\` is not installed. Please install it with \`yarn add expo\` and try again.`, 'MODULE_NOT_FOUND');
}
//# sourceMappingURL=Project.js.map