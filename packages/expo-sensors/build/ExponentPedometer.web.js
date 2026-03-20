export default {
    async isAvailableAsync() {
        return false;
    },
    async isRecordingAvailableAsync() {
        return false;
    },
    async isEventTrackingAvailableAsync() {
        return false;
    },
    async startEventUpdates() {
        // no-op on web
    },
    async stopEventUpdates() {
        // no-op on web
    },
    async subscribeRecordingAsync() {
        // no-op on web
    },
    async unsubscribeRecordingAsync() {
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