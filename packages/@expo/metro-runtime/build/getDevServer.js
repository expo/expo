import { Platform } from 'expo-modules-core';
import qs from 'qs';
const getDevServer = () => {
    // Disable for SSR
    if (!Platform.isDOMAvailable) {
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
            const query = qs.parse(url);
            return (location.origin +
                location.pathname +
                '?' +
                qs.stringify({ ...query, platform: Platform.OS }));
        },
        url: location.origin + location.pathname,
    };
};
export default getDevServer;
//# sourceMappingURL=getDevServer.js.map