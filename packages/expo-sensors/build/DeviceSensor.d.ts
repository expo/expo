import { EventEmitter, Subscription } from 'expo-core';
declare type Listener<E> = (event: E) => void;
declare type NativeSensorModule = any;
/**
 * A base class for subscribable sensors. The events emitted by this class are measurements
 * specified by the parameter type `M`.
 */
export default class DeviceSensor<M> {
    _nativeModule: NativeSensorModule;
    _nativeEmitter: EventEmitter;
    _nativeEventName: string;
    _listenerCount: number;
    constructor(nativeSensorModule: NativeSensorModule, nativeEventName: string);
    addListener(listener: Listener<M>): Subscription;
    hasListeners(): boolean;
    getListenerCount(): number;
    removeAllListeners(): void;
    removeSubscription(subscription: Subscription): void;
    setUpdateInterval(intervalMs: number): void;
    isAvailableAsync(): Promise<boolean>;
}
export {};
