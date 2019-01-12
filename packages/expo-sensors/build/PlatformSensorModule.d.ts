import { EventEmitter } from 'expo-core';
export default class PlatformSensorModule {
    emitter: EventEmitter;
    _updateInterval: number;
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
    startObserving: () => void;
    stopObserving: () => void;
    setUpdateInterval: (intervalMs: number) => Promise<void>;
}
