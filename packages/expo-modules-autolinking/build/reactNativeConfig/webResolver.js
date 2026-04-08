"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDependencyWebAsync = checkDependencyWebAsync;
const utils_1 = require("../utils");
async function checkDependencyWebAsync(resolution, reactNativeConfig, expoModuleConfig) {
    if (!reactNativeConfig || expoModuleConfig) {
        // Skip autolinking for this package.
        // Skip autolinking web when we have an expo module config
        return null;
    }
    const hasReactNativeConfig = !!reactNativeConfig && Object.keys(reactNativeConfig).length > 0;
    if (!hasReactNativeConfig) {
        const packageJson = await (0, utils_1.loadPackageJson)((0, utils_1.fastJoin)(resolution.path, 'package.json'));
        if (!packageJson) {
            return null;
        }
        const peerDependencies = packageJson.peerDependencies && typeof packageJson.peerDependencies === 'object'
            ? packageJson.peerDependencies
            : {};
        const codegenConfig = packageJson.codegenConfig && typeof packageJson.codegenConfig === 'object'
            ? packageJson.codegenConfig
            : null;
        const hasReactNativePeer = !!peerDependencies['react-native'];
        const hasCodegenConfig = !!codegenConfig && Object.keys(codegenConfig).length > 0;
        // NOTE(@kitten): This is a heuristic for React Native modules that don't have a config file
        // They'll still be considered a native module when they have a peer dependency on react-native
        // and contain a `codegenConfig` entry
        if (!hasReactNativePeer || !hasCodegenConfig) {
            return null;
        }
    }
    return {
        version: resolution.version,
    };
}
//# sourceMappingURL=webResolver.js.map