"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageSourceAsync = exports.getDefaultPackageSourcesAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const Utils_1 = require("./Utils");
const debug = require('debug')('expo:fingerprint:sourcer:Packages');
const DEFAULT_PACKAGES = [
    {
        packageName: 'react-native',
        packageJsonOnly: true,
    },
];
async function getDefaultPackageSourcesAsync(projectRoot, options) {
    const results = await Promise.all(DEFAULT_PACKAGES.map((params) => getPackageSourceAsync(projectRoot, params)));
    return results.filter(Boolean);
}
exports.getDefaultPackageSourcesAsync = getDefaultPackageSourcesAsync;
async function getPackageSourceAsync(projectRoot, params) {
    const reason = `package:${params.packageName}`;
    const packageJsonPath = resolve_from_1.default.silent(projectRoot, `${params.packageName}/package.json`);
    if (packageJsonPath == null) {
        return null;
    }
    debug(`Adding package - ${chalk_1.default.dim(params.packageName)}`);
    if (params.packageJsonOnly) {
        return {
            type: 'contents',
            id: reason,
            contents: JSON.stringify(require(packageJsonPath)),
            reasons: [reason],
        };
    }
    const packageRoot = path_1.default.relative(projectRoot, path_1.default.dirname(packageJsonPath));
    return await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, packageRoot, reason);
}
exports.getPackageSourceAsync = getPackageSourceAsync;
//# sourceMappingURL=Packages.js.map