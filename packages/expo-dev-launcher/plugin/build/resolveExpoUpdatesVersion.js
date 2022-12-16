"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExpoUpdatesVersion = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
function resolveExpoUpdatesVersion(projectRoot) {
    let expoUpdatesBuildPath;
    try {
        expoUpdatesBuildPath = (0, resolve_from_1.default)(projectRoot, 'expo-updates');
    }
    catch {
        // this is expected in projects that don't have expo-updates installed
        return null;
    }
    if (!expoUpdatesBuildPath) {
        return null;
    }
    const expoUpdatesPackageJsonPath = path_1.default.resolve(path_1.default.dirname(expoUpdatesBuildPath), '../package.json');
    if (!fs_1.default.existsSync(expoUpdatesPackageJsonPath)) {
        return null;
    }
    const packageJsonString = fs_1.default.readFileSync(expoUpdatesPackageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonString);
    return packageJson.version;
}
exports.resolveExpoUpdatesVersion = resolveExpoUpdatesVersion;
