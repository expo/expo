import { Platform } from 'expo-modules-core';
export default {
    get name() {
        return 'ExpoUpdates';
    },
    async reload() {
        if (!Platform.isDOMAvailable)
            return;
        window.location.reload(true);
    },
};
//# sourceMappingURL=ExpoUpdates.web.js.map