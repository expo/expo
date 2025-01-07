"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfyExpoVersion = exports.resolveExpoAutolinkingVersion = exports.resolveExpoAutolinkingCliPath = exports.resolveExpoAutolinkingPackageRoot = exports.resolveExpoEnvPath = exports.resolveExpoVersion = void 0;
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
let cachedExpoAutolinkingPackageRoot = null;
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
 * Resolve the path to the `@expo/env` package in the project.
 */
function resolveExpoEnvPath(projectRoot) {
    const expoPackageRoot = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    const expoEnvPackageJsonPath = resolve_from_1.default.silent(expoPackageRoot ?? projectRoot, '@expo/env/package.json');
    if (expoEnvPackageJsonPath) {
        return path_1.default.dirname(expoEnvPackageJsonPath);
    }
    return null;
}
exports.resolveExpoEnvPath = resolveExpoEnvPath;
/**
 * Resolve the package root of `expo-modules-autolinking` package in the project.
 */
function resolveExpoAutolinkingPackageRoot(projectRoot) {
    if (cachedExpoAutolinkingPackageRoot) {
        const [cachedProjectRoot, cachedPackageRoot] = cachedExpoAutolinkingPackageRoot;
        if (cachedProjectRoot === projectRoot) {
            return cachedPackageRoot;
        }
    }
    const expoPackageRoot = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    const autolinkingPackageJsonPath = resolve_from_1.default.silent(expoPackageRoot ?? projectRoot, 'expo-modules-autolinking/package.json');
    if (autolinkingPackageJsonPath) {
        const autolinkingPackageRoot = path_1.default.dirname(autolinkingPackageJsonPath);
        cachedExpoAutolinkingPackageRoot = [projectRoot, autolinkingPackageRoot];
        return autolinkingPackageRoot;
    }
    return null;
}
exports.resolveExpoAutolinkingPackageRoot = resolveExpoAutolinkingPackageRoot;
/**
 * Resolve the path to the `expo-modules-autolinking` CLI in the project.
 * @throws If the package is not found in the project.
 */
function resolveExpoAutolinkingCliPath(projectRoot) {
    const autolinkingPackageRoot = resolveExpoAutolinkingPackageRoot(projectRoot);
    if (autolinkingPackageRoot == null) {
        throw new Error('Cannot resolve expo-modules-autolinking package in the project.');
    }
    return path_1.default.join(autolinkingPackageRoot, 'bin', 'expo-modules-autolinking.js');
}
exports.resolveExpoAutolinkingCliPath = resolveExpoAutolinkingCliPath;
/**
 * Resolve the version of `expo-modules-autolinking` package in the project.
 */
function resolveExpoAutolinkingVersion(projectRoot) {
    const autolinkingPackageRoot = resolveExpoAutolinkingPackageRoot(projectRoot);
    if (autolinkingPackageRoot) {
        const autolinkingPackageJson = require(path_1.default.join(autolinkingPackageRoot, 'package.json'));
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
//# sourceMappingURL=ExpoResolver.js.map