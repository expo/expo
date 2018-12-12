import { EventEmitter } from 'expo-core';
export default class PlatformModule {
    constructor() {
        this.emitter = new EventEmitter({ addListener() { }, removeListeners() { } });
    }
    get name() {
        throw new Error('PlatformModule.name should be implemented');
    }
    addListener(eventName) { }
    removeListeners(count) { }
    startObserving() { }
    stopObserving() { }
    async setUpdateInterval(intervalMs) { }
}
//# sourceMappingURL=PlatformModule.js.map