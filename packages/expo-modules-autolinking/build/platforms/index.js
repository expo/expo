"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkingImplementationForPlatform = getLinkingImplementationForPlatform;
exports.getSupportPackageForPlatform = getSupportPackageForPlatform;
function getLinkingImplementationForPlatform(platform) {
    if (!platform) {
        throw new Error(`No platform was specified, but linking commands require a specific platform.`);
    }
    switch (platform) {
        case 'ios':
        case 'macos':
        case 'tvos':
        case 'apple':
            return require('../platforms/apple');
        case 'android':
            return require('../platforms/android');
        case 'devtools':
            return require('../platforms/devtools');
        case 'web':
            return require('../platforms/web');
        default:
            throw new Error(`No linking implementation is available for platform "${platform}"`);
    }
}
function getSupportPackageForPlatform(platform) {
    switch (platform) {
        case 'ios':
        case 'android':
            return 'react-native';
        case 'tvos':
            return 'react-native-tvos';
        case 'macos':
            return 'react-native-macos';
        case 'windows':
            return 'react-native-windows';
        case 'apple':
        case 'web':
        case 'devtools':
            return null;
        default:
            throw new Error(`No support package is known for platform "${platform}"`);
    }
}
//# sourceMappingURL=index.js.map