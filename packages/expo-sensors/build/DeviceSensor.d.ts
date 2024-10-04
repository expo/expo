import { PermissionResponse, PermissionStatus, type EventSubscription, PermissionExpiration } from 'expo-modules-core';
/**
 * @hidden
 */
export type Listener<E> = (event: E) => void;
type NativeSensorModule = any;
/**
 * A base class for subscribable sensors. The events emitted by this class are measurements
 * specified by the parameter type `Measurement`.
 */
export default class DeviceSensor<Measurement> {
    _nativeModule: NativeSensorModule;
    _nativeEventName: string;
    constructor(nativeSensorModule: NativeSensorModule, nativeEventName: string);
    addListener(listener: Listener<Measurement>): EventSubscription;
    /**
     * Returns boolean which signifies if sensor has any listeners registered.
     */
    hasListeners(): boolean;
    /**
     * Returns the registered listeners count.
     */
    getListenerCount(): number;
    /**
     * Removes all registered listeners.
     */
    removeAllListeners(): void;
    /**
     * Removes the given subscription.
     * @param subscription A subscription to remove.
     */
    removeSubscription(subscription: EventSubscription): void;
    /**
     * Set the sensor update interval.
     *
     * @param intervalMs Desired interval in milliseconds between sensor updates.
     * > Starting from Android 12 (API level 31), the system has a 200ms limit for each sensor updates.
     * >
     * > If you need an update interval less than 200ms, you should:
     * > * add `android.permission.HIGH_SAMPLING_RATE_SENSORS` to [**app.json** `permissions` field](/versions/latest/config/app/#permissions)
     * > * or if you are using bare workflow, add `<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS"/>` to **AndroidManifest.xml**.
     */
    setUpdateInterval(intervalMs: number): void;
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
     */
    isAvailableAsync(): Promise<boolean>;
    /**
     * Checks user's permissions for accessing sensor.
     */
    getPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing sensor.
     */
    requestPermissionsAsync(): Promise<PermissionResponse>;
}
export { PermissionStatus };
export type { EventSubscription as Subscription, PermissionResponse, PermissionExpiration };
//# sourceMappingURL=DeviceSensor.d.ts.map