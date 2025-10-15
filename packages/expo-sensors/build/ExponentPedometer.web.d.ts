declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    isRecordingAvailableAsync(): Promise<boolean>;
    startEventUpdates(): Promise<boolean>;
    stopEventUpdates(): Promise<void>;
    subscribeRecording(): Promise<void>;
    unsubscribeRecording(): Promise<void>;
    addListener(): {
        remove(): void;
    };
    removeListeners(): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExponentPedometer.web.d.ts.map