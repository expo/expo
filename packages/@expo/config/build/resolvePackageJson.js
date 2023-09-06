"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootPackageJsonPath = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const Errors_1 = require("./Errors");
function getRootPackageJsonPath(projectRoot) {
    const packageJsonPath = (0, path_1.join)(projectRoot, 'package.json');
    if (!(0, fs_1.existsSync)(packageJsonPath)) {
        throw new Errors_1.ConfigError(`The expected package.json path: ${packageJsonPath} does not exist`, 'MODULE_NOT_FOUND');
    }
    return packageJsonPath;
}
exports.getRootPackageJsonPath = getRootPackageJsonPath;
