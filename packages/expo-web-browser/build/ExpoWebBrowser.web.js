export default {
    get name() {
        return 'ExpoWebBrowser';
    },
    async openBrowserAsync(url, browserParams = {}) {
        const { windowName = '_blank', windowFeatures, replace } = browserParams;
        window.open(url, windowName, windowFeatures, replace);
        return { type: 'dismiss' };
    },
};
//# sourceMappingURL=ExpoWebBrowser.web.js.map