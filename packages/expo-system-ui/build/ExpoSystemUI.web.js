import { Platform } from 'expo-modules-core';
export default {
    get name() {
        return 'ExpoSystemUI';
    },
    getBackgroundColorAsync() {
        if (Platform.isDOMAvailable) {
            return document.body.style.backgroundColor;
        }
        else {
            return null;
        }
    },
    setBackgroundColorAsync(color) {
        if (Platform.isDOMAvailable) {
            document.body.style.backgroundColor = color;
        }
    },
};
//# sourceMappingURL=ExpoSystemUI.web.js.map