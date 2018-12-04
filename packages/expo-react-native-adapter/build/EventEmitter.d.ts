import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';
declare type NativeModule = {
    startObserving?: () => void;
    stopObserving?: () => void;
};
declare type Subscription = {
    remove: () => void;
};
export default class EventEmitter {
    _listenersCount: number;
    _nativeModule: NativeModule;
    _eventEmitter: NativeEventEmitter;
    constructor(nativeModule: NativeModule);
    addListener<T>(eventName: string, listener: (event: T) => void): Subscription;
    removeAllListeners(eventName: string): void;
    removeSubscription(subscription: Subscription): void;
    emit(eventType: string, ...params: any[]): void;
}
export {};
