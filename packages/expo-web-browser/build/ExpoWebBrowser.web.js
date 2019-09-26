export default {
    get name() {
        return 'ExpoWebBrowser';
    },
    async openBrowserAsync(url, browserParams = {}) {
        const { windowName = '_blank', windowFeatures } = browserParams;
        window.open(url, windowName, windowFeatures);
        return { type: 'dismiss' };
    },
};
//# sourceMappingURL=ExpoWebBrowser.web.js.map