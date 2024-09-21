"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExpoAutolinkingVersion = void 0;
const resolve_from_1 = __importDefault(require("resolve-from"));
function resolveExpoAutolinkingVersion(projectRoot) {
    const expoPackageRoot = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    const autolinkingPackageJsonPath = resolve_from_1.default.silent(expoPackageRoot ?? projectRoot, 'expo-modules-autolinking/package.json');
    if (autolinkingPackageJsonPath) {
        const autolinkingPackageJson = require(autolinkingPackageJsonPath);
        return autolinkingPackageJson.version;
    }
    return null;
}
exports.resolveExpoAutolinkingVersion = resolveExpoAutolinkingVersion;
//# sourceMappingURL=ExpoVersions.js.map