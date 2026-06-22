"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPkgVersion = getPkgVersion;
const json_file_1 = __importDefault(require("@expo/json-file"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const findUpPackageJsonPath_1 = require("./findUpPackageJsonPath");
function getPkgVersion(projectRoot, pkgName) {
    const targetPkg = resolve_from_1.default.silent(projectRoot, pkgName);
    if (!targetPkg)
        return null;
    const targetPkgJson = (0, findUpPackageJsonPath_1.findUpPackageJsonPath)(targetPkg);
    if (!targetPkgJson)
        return null;
    const pkg = json_file_1.default.read(targetPkgJson);
    const pkgVersion = pkg.version;
    if (typeof pkgVersion === 'string') {
        return pkgVersion;
    }
    return null;
}
//# sourceMappingURL=getPkgVersion.js.map