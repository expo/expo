import { NativeEventEmitter } from 'react-native';
declare type NativeModule = {
    startObserving?: () => void;
    stopObserving?: () => void;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
};
export declare type Subscription = {
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