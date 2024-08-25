const webModule = {
    getBackgroundColorAsync() {
        if (typeof window === 'undefined') {
            return null;
        }
        const normalizeColor = require('react-native-web/dist/cjs/modules/normalizeColor');
        return normalizeColor(document.body.style.backgroundColor);
    },
    async setBackgroundColorAsync(color) {
        if (typeof window !== 'undefined') {
            document.body.style.backgroundColor = (typeof color === 'string' ? color : null) ?? 'white';
        }
    },
    async setSystemBarsConfigAsync(_config) {
        // has no effect on web platform
    },
};
export default webModule;
//# sourceMappingURL=ExpoSystemUI.web.js.map