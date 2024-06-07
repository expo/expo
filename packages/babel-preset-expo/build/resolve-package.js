"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectTransitiveDependency = exports.requireUpstreamBabelPreset = void 0;
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
/**
 * Resolve and import the @react-native/babel-preset package.
 */
function requireUpstreamBabelPreset() {
    const reactNativePackageJsonPath = require.resolve('react-native/package.json');
    const reactNativePath = path_1.default.dirname(reactNativePackageJsonPath);
    const babelPresetPath = resolveProjectTransitiveDependency(reactNativePath, '@react-native/community-cli-plugin', '@react-native/metro-babel-transformer', '@react-native/babel-preset');
    if (!babelPresetPath) {
        throw new Error('Unable to resolve the @react-native/babel-preset package.');
    }
    return require(babelPresetPath);
}
exports.requireUpstreamBabelPreset = requireUpstreamBabelPreset;
/**
 * Resolve the path to a transitive dependency from the project.
 */
function resolveProjectTransitiveDependency(projectRoot, ...deps) {
    let currentDir = projectRoot;
    for (let i = 0; i < deps.length; ++i) {
        const dep = deps[i];
        const target = i === deps.length - 1 ? dep : `${dep}/package.json`;
        const resolved = resolve_from_1.default.silent(currentDir, target);
        if (!resolved) {
            currentDir = null;
            break;
        }
        if (i === deps.length - 1) {
            return resolved;
        }
        currentDir = path_1.default.dirname(resolved);
    }
    return null;
}
exports.resolveProjectTransitiveDependency = resolveProjectTransitiveDependency;
