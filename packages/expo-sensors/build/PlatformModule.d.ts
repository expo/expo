import { EventEmitter } from 'expo-core';
export default class PlatformModule {
    emitter: EventEmitter;
    readonly name: string;
    addListener(eventName: string): void;
    removeListeners(count: number): void;
    startObserving(): void;
    stopObserving(): void;
    setUpdateInterval(intervalMs: number): Promise<void>;
}
