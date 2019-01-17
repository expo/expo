export default class PlatformSensorModule {
    _updateInterval: number;
    emitter: any;
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
    startObserving: () => void;
    stopObserving: () => void;
    setUpdateInterval: (intervalMs: number) => Promise<void>;
}
