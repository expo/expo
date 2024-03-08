export default {
    getBackgroundColorAsync() {
        if (typeof window === 'undefined') {
            return null;
        }
        const normalizeColor = require('react-native-web/dist/cjs/modules/normalizeColor');
        return normalizeColor(document.body.style.backgroundColor);
    },
    setBackgroundColorAsync(color) {
        if (typeof window !== 'undefined') {
            document.body.style.backgroundColor = color ?? 'white';
        }
    },
};
//# sourceMappingURL=ExpoSystemUI.web.js.map