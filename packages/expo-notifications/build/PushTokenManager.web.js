let warningHasBeenShown = false;
export default {
    addListener: () => {
        if (!warningHasBeenShown) {
            console.warn('[expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.');
            warningHasBeenShown = true;
        }
    },
    removeListeners: () => { },
};
//# sourceMappingURL=PushTokenManager.web.js.map