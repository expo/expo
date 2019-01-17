import GlobalPlatformEmitter from './GlobalPlatformEmitter';
export default class PlatformSensorModule {
    constructor() {
        this._updateInterval = 0;
        this.emitter = GlobalPlatformEmitter;
        this.addListener = (eventName) => { };
        this.removeListeners = (count) => { };
        this.startObserving = () => { };
        this.stopObserving = () => { };
        this.setUpdateInterval = async (intervalMs) => {
            this._updateInterval = intervalMs;
        };
    }
    // get emitter() {
    //   return RCTDeviceEventEmitter.sharedSubscriber;
    // }
    get name() {
        throw new Error('PlatformSensorModule.name should be implemented');
    }
    async isAvailableAsync() {
        return false;
    }
}
//# sourceMappingURL=PlatformSensorModule.js.map