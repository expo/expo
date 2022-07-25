"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootPackageJsonPath = getRootPackageJsonPath;

function _fs() {
  const data = require("fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function () {
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

function fileExists(file) {
  try {
    return (0, _fs().statSync)(file).isFile();
  } catch {
    return false;
  }
}

function getRootPackageJsonPath(projectRoot) {
  const packageJsonPath = (0, _path().join)(projectRoot, 'package.json');

  if (!fileExists(packageJsonPath)) {
    throw new (_Errors().ConfigError)(`The expected package.json path: ${packageJsonPath} does not exist`, 'MODULE_NOT_FOUND');
  }

  return packageJsonPath;
}
//# sourceMappingURL=resolvePackageJson.js.map