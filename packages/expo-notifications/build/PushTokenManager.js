import { Platform } from 'expo-modules-core';
let warningHasBeenShown = false;
export default {
    addListener: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Listening to push token changes is not yet fully supported on ${Platform.OS}. Adding a listener will have no effect.`);
            warningHasBeenShown = true;
        }
    },
    removeListeners: () => { },
};
//# sourceMappingURL=PushTokenManager.js.map