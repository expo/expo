import { Platform } from 'expo-modules-core';
let warningHasBeenShown = false;
export default {
    addListener: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Notifications handling is not yet fully supported on ${Platform.OS}. Handling notifications will have no effect.`);
            warningHasBeenShown = true;
        }
    },
    removeListeners: () => { },
};
//# sourceMappingURL=NotificationsHandlerModule.js.map