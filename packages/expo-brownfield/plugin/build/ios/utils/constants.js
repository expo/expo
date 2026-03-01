"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
exports.Constants = {
    BuildPhase: {
        PatchExpoPhase: 'Patch ExpoModulesProvider',
        RNBundlePhase: 'Bundle React Native code and images',
        Script: 'PBXShellScriptBuildPhase',
        Sources: 'PBXSourcesBuildPhase',
    },
    Target: {
        ApplicationProductType: '"com.apple.product-type.application"',
        Framework: 'framework',
    },
    Utils: {
        XCEmptyString: '""', // Empty string needs to be double quoted
    },
};
