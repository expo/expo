import invariant from 'invariant';
import { NativeEventEmitter, Platform } from 'react-native';
const nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';
export class EventEmitter {
    constructor(nativeModule) {
        this._listenerCount = 0;
        this._nativeModule = nativeModule;
        this._eventEmitter = new NativeEventEmitter(nativeModule);
    }
    addListener(eventName, listener) {
        if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.startObserving) {
            this._nativeModule.startObserving();
        }
        this._listenerCount++;
        const nativeEmitterSubscription = this._eventEmitter.addListener(eventName, listener);
        const subscription = {
            [nativeEmitterSubscriptionKey]: nativeEmitterSubscription,
            remove: () => {
                this.removeSubscription(subscription);
            },
        };
        return subscription;
    }
    removeAllListeners(eventName) {
        // @ts-ignore: the EventEmitter interface has been changed in react-native@0.64.0
        const removedListenerCount = this._eventEmitter.listenerCount
            ? // @ts-ignore: this is available since 0.64
                this._eventEmitter.listenerCount(eventName)
            : // @ts-ignore: this is available in older versions
                this._eventEmitter.listeners(eventName).length;
        this._eventEmitter.removeAllListeners(eventName);
        this._listenerCount -= removedListenerCount;
        invariant(this._listenerCount >= 0, `EventEmitter must have a non-negative number of listeners`);
        if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
            this._nativeModule.stopObserving();
        }
    }
    removeSubscription(subscription) {
        const nativeEmitterSubscription = subscription[nativeEmitterSubscriptionKey];
        if (!nativeEmitterSubscription) {
            return;
        }
        this._eventEmitter.removeSubscription(nativeEmitterSubscription);
        this._listenerCount--;
        // Ensure that the emitter's internal state remains correct even if `removeSubscription` is
        // called again with the same subscription
        delete subscription[nativeEmitterSubscriptionKey];
        // Release closed-over references to the emitter
        subscription.remove = () => { };
        if (!this._listenerCount && Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
            this._nativeModule.stopObserving();
        }
    }
    emit(eventName, ...params) {
        this._eventEmitter.emit(eventName, ...params);
    }
}
//# sourceMappingURL=EventEmitter.js.map