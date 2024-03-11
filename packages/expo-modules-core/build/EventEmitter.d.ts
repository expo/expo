import { NativeEventEmitter } from 'react-native';
type NativeModule = {
    __expo_module_name__?: string;
    startObserving?: () => void;
    stopObserving?: () => void;
    addListener?: any;
    removeListeners?: any;
};
export type Subscription = {
    /**
     * A method to unsubscribe the listener.
     */
    remove: () => void;
};
export declare class EventEmitter {
    _listenerCount: number;
    _nativeModule: NativeModule;
    _eventEmitter: NativeEventEmitter;
    constructor(nativeModule: NativeModule);
    addListener<T>(eventName: string, listener: (event: T) => void): Subscription;
    removeAllListeners(eventName: string): void;
    removeSubscription(subscription: Subscription): void;
    emit(eventName: string, ...params: any[]): void;
}
export {};
//# sourceMappingURL=EventEmitter.d.ts.map