"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCustomPlatforms = resolveCustomPlatforms;
exports.createCustomPlatformResolver = createCustomPlatformResolver;
const KNOWN_CUSTOM_PLATFORMS = [
    { name: 'macos', package: 'react-native-macos' },
    { name: 'windows', package: 'react-native-windows' },
];
/**
 * Resolve all known out-of-tree platforms from the project's package json.
 * This also requires a list of platforms to resolve.
 */
function resolveCustomPlatforms(packageFile, customPlatforms) {
    const resolvedPlatforms = {};
    const customPlatformList = customPlatforms === true ? KNOWN_CUSTOM_PLATFORMS : customPlatforms;
    for (const knownPlatform of customPlatformList) {
        if (packageFile.dependencies?.[knownPlatform.package]) {
            resolvedPlatforms[knownPlatform.name] = knownPlatform.package;
        }
    }
    return Object.keys(resolvedPlatforms).length > 0 ? resolvedPlatforms : null;
}
/** Create a custom Metro resolver for OOT platforms, based on the resolved platforms */
function createCustomPlatformResolver(platforms) {
    if (!platforms)
        return undefined;
    return function customPlatformResolver(context, moduleName, platform) {
        // Only remap `react-native` imports for resolved OOT platforms
        if (platform && (moduleName === 'react-native' || moduleName.startsWith('react-native/'))) {
            const customPlatform = platforms[platform];
            if (customPlatform) {
                return context.resolveRequest(context, moduleName.replace('react-native', customPlatform), platform);
            }
        }
        // Fallback to normal resolution
        return context.resolveRequest(context, moduleName, platform);
    };
}
//# sourceMappingURL=customPlatforms.js.map