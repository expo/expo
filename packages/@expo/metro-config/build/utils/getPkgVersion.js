"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPkgVersion = getPkgVersion;
exports.getPkgVersionFromPath = getPkgVersionFromPath;
exports.findUpPackageJson = findUpPackageJson;
const json_file_1 = __importDefault(require("@expo/json-file"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
function getPkgVersion(projectRoot, pkgName) {
    const targetPkg = resolve_from_1.default.silent(projectRoot, pkgName);
    if (!targetPkg)
        return null;
    const targetPkgJson = findUpPackageJson(targetPkg);
    if (!targetPkgJson)
        return null;
    return getPkgVersionFromPath(targetPkgJson);
}
function getPkgVersionFromPath(packageJsonPath) {
    const pkg = json_file_1.default.read(packageJsonPath);
    const pkgVersion = pkg.version;
    if (typeof pkgVersion === 'string') {
        return pkgVersion;
    }
    return null;
}
function findUpPackageJson(cwd) {
    if (['.', path_1.default.sep].includes(cwd))
        return null;
    const found = resolve_from_1.default.silent(cwd, './package.json');
    if (found) {
        return found;
    }
    return findUpPackageJson(path_1.default.dirname(cwd));
}
//# sourceMappingURL=getPkgVersion.js.map