import { PermissionResponse, PermissionStatus, EventEmitter, Subscription, PermissionExpiration } from 'expo-modules-core';
/**
 * @hidden
 */
export declare type Listener<E> = (event: E) => void;
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
    addListener: (listener: Listener<M>) => Subscription;
    /**
     * Returns boolean which signifies if sensor has any listeners registered.
     */
    hasListeners: () => boolean;
    /**
     * Returns the registered listeners count.
     */
    getListenerCount: () => number;
    /**
     * Removes all registered listeners.
     */
    removeAllListeners: () => void;
    /**
     * Removes the given subscription.
     * @param subscription A subscription to remove.
     */
    removeSubscription: (subscription: Subscription) => void;
    /**
     * Set the sensor update interval.
     * @param intervalMs Desired interval value in milliseconds.
     */
    setUpdateInterval: (intervalMs: number) => void;
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
     */
    isAvailableAsync: () => Promise<boolean>;
    /**
     * Checks user's permissions for accessing sensor.
     */
    getPermissionsAsync: () => Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing sensor.
     */
    requestPermissionsAsync: () => Promise<PermissionResponse>;
}
export { PermissionExpiration, PermissionResponse, PermissionStatus, Subscription };
//# sourceMappingURL=DeviceSensor.d.ts.map