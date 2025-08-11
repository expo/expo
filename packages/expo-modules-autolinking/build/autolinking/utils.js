"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkingImplementationForPlatform = getLinkingImplementationForPlatform;
function getLinkingImplementationForPlatform(platform) {
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
    }
}
//# sourceMappingURL=utils.js.map