let warningHasBeenShown = false;
export default {
    addListener: () => {
        if (!warningHasBeenShown) {
            console.warn('[expo-notifications] Notifications handling is not yet fully supported on web. Handling notifications will have no effect.');
            warningHasBeenShown = true;
        }
    },
    removeListeners: () => { },
};
//# sourceMappingURL=PushTokenManager.web.js.map