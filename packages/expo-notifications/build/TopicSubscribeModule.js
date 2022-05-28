let warningHasBeenShown = false;
export default {
    addListener: () => { },
    removeListeners: () => { },
    topicSubscribeAsync: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Subscribing to broadcast topics is supported only on Android.`);
            warningHasBeenShown = true;
        }
        // Shouldn't this be a rejection?
        // expo design principles say no
        return Promise.resolve();
    },
};
//# sourceMappingURL=TopicSubscribeModule.js.map