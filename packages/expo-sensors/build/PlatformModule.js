import { EventEmitter } from 'expo-core';
export default class PlatformModule {
    constructor() {
        this.emitter = new EventEmitter({});
        this._updateInterval = 0;
        this.addListener = (eventName) => { };
        this.removeListeners = (count) => { };
        this.startObserving = () => { };
        this.stopObserving = () => { };
        this.setUpdateInterval = async (intervalMs) => {
            this._updateInterval = intervalMs;
        };
    }
    get name() {
        throw new Error('PlatformModule.name should be implemented');
    }
    async isAvailableAsync() {
        return false;
    }
}
//# sourceMappingURL=PlatformModule.js.map