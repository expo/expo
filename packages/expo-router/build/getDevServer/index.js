"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevServer = void 0;
const expo_modules_core_1 = require("expo-modules-core");
const getDevServer = () => {
    // Disable for SSR
    if (!expo_modules_core_1.Platform.isDOMAvailable) {
        return {
            bundleLoadedFromServer: true,
            fullBundleUrl: '',
            url: '',
        };
    }
    return {
        // The bundle is always loaded from a server in the browser.
        bundleLoadedFromServer: true,
        /** URL but ensures that platform query param is added. */
        get fullBundleUrl() {
            if (document?.currentScript && 'src' in document.currentScript) {
                return document.currentScript.src;
            }
            const query = new URLSearchParams(location.search);
            query.append('platform', expo_modules_core_1.Platform.OS);
            return location.origin + location.pathname + '?' + query;
        },
        url: location.origin + '/',
    };
};
exports.getDevServer = getDevServer;
//# sourceMappingURL=index.js.map