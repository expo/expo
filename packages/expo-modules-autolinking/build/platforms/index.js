"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkingImplementationForPlatform = getLinkingImplementationForPlatform;
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
//# sourceMappingURL=index.js.map