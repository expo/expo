declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    isRecordingAvailableAsync(): Promise<boolean>;
    isEventTrackingAvailableAsync(): Promise<boolean>;
    startEventUpdates(): Promise<void>;
    stopEventUpdates(): Promise<void>;
    subscribeRecordingAsync(): Promise<void>;
    unsubscribeRecordingAsync(): Promise<void>;
    addListener(): {
        remove(): void;
    };
    removeListeners(): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExponentPedometer.web.d.ts.map