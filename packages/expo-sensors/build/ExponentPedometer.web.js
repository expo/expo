export default {
    async isAvailableAsync() {
        return false;
    },
    async isRecordingAvailableAsync() {
        return false;
    },
    async startEventUpdates() {
        return false;
    },
    async stopEventUpdates() {
        // no-op on web
    },
    async subscribeRecording() {
        // no-op on web
    },
    async unsubscribeRecording() {
        // no-op on web
    },
    addListener() {
        return {
            remove() { },
        };
    },
    removeListeners() { },
    startObserving() { },
    stopObserving() { },
};
//# sourceMappingURL=ExponentPedometer.web.js.map