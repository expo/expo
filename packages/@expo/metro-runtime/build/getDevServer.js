"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qs_1 = __importDefault(require("qs"));
const getDevServer = () => {
    // Disable for SSR
    if (typeof window === 'undefined') {
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
            const url = window.location.toString();
            const query = qs_1.default.parse(url);
            return (location.origin + location.pathname + '?' + qs_1.default.stringify({ ...query, platform: 'web' }));
        },
        url: location.origin + location.pathname,
    };
};
exports.default = getDevServer;
//# sourceMappingURL=getDevServer.js.map