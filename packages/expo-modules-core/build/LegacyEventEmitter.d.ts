import { NativeEventEmitter } from 'react-native';
import { EventSubscription } from './EventEmitter';
type NativeModule = {
    __expo_module_name__?: string;
    startObserving?: () => void;
    stopObserving?: () => void;
    addListener?: any;
    removeListeners?: any;
};
/**
 * @deprecated Deprecated in favor of `EventEmitter`.
 */
export declare class LegacyEventEmitter {
    _listenerCount: number;
    _nativeModule: NativeModule;
    _eventEmitter: NativeEventEmitter;
    constructor(nativeModule: NativeModule);
    addListener<T>(eventName: string, listener: (event: T) => void): EventSubscription;
    removeAllListeners(eventName: string): void;
    removeSubscription(subscription: EventSubscription): void;
    emit(eventName: string, ...params: any[]): void;
}
export {};
//# sourceMappingURL=LegacyEventEmitter.d.ts.map