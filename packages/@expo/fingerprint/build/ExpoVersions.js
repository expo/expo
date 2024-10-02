"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfyExpoVersion = exports.resolveExpoAutolinkingVersion = exports.resolveExpoVersion = void 0;
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
/**
 * Resolve the version of `expo` package in the project.
 */
function resolveExpoVersion(projectRoot) {
    const expoPackageJsonPath = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    if (expoPackageJsonPath) {
        const expoPackageJson = require(expoPackageJsonPath);
        return expoPackageJson.version;
    }
    return null;
}
exports.resolveExpoVersion = resolveExpoVersion;
/**
 * Resolve the version of `expo-modules-autolinking` package in the project.
 */
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
/**
 * Resolve the `expo` package version and check if it satisfies the provided semver range.
 * @returns `null` if the `expo` package is not found in the project.
 */
function satisfyExpoVersion(projectRoot, range) {
    const expoVersion = resolveExpoVersion(projectRoot);
    if (expoVersion) {
        return semver_1.default.satisfies(expoVersion, range);
    }
    return null;
}
exports.satisfyExpoVersion = satisfyExpoVersion;
//# sourceMappingURL=ExpoVersions.js.map