let warningHasBeenShown = false;
const module = {
    addListener: () => { },
    removeListeners: () => { },
    subscribeToTopicAsync: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Broadcast topics are supported only on Android.`);
            warningHasBeenShown = true;
        }
        return Promise.resolve();
    },
    unsubscribeFromTopicAsync: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Broadcast topics are supported only on Android.`);
            warningHasBeenShown = true;
        }
        return Promise.resolve();
    },
};
export default module;
//# sourceMappingURL=TopicSubscriptionModule.js.map