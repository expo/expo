import {
  PermissionResponse,
  PermissionStatus,
  type EventSubscription,
  Platform,
  PermissionExpiration,
} from 'expo-modules-core';

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

  constructor(nativeSensorModule: NativeSensorModule, nativeEventName: string) {
    this._nativeModule = nativeSensorModule;
    this._nativeEventName = nativeEventName;
  }

  addListener(listener: Listener<Measurement>): EventSubscription {
    return this._nativeModule.addListener(this._nativeEventName, listener);
  }

  /**
   * Returns boolean which signifies if sensor has any listeners registered.
   */
  hasListeners(): boolean {
    return this._nativeModule.listenerCount(this._nativeEventName) > 0;
  }

  /**
   * Returns the registered listeners count.
   */
  getListenerCount(): number {
    return this._nativeModule.listenerCount(this._nativeEventName);
  }

  /**
   * Removes all registered listeners.
   */
  removeAllListeners(): void {
    this._nativeModule.removeAllListeners(this._nativeEventName);
  }

  /**
   * Removes the given subscription.
   * @param subscription A subscription to remove.
   */
  removeSubscription(subscription: EventSubscription): void {
    subscription.remove();
  }

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
  setUpdateInterval(intervalMs: number): void {
    if (!this._nativeModule.setUpdateInterval) {
      console.warn(`expo-sensors: setUpdateInterval() is not supported on ${Platform.OS}`);
    } else {
      this._nativeModule.setUpdateInterval(intervalMs);
    }
  }

  /**
   * > **info** You should always check the sensor availability before attempting to use it.
   * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
   */
  async isAvailableAsync(): Promise<boolean> {
    if (!this._nativeModule.isAvailableAsync) {
      return false;
    } else {
      return await this._nativeModule.isAvailableAsync();
    }
  }

  /**
   * Checks user's permissions for accessing sensor.
   */
  async getPermissionsAsync(): Promise<PermissionResponse> {
    if (!this._nativeModule.getPermissionsAsync) {
      return defaultPermissionsResponse;
    } else {
      return await this._nativeModule.getPermissionsAsync();
    }
  }

  /**
   * Asks the user to grant permissions for accessing sensor.
   */
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    if (!this._nativeModule.requestPermissionsAsync) {
      return defaultPermissionsResponse;
    } else {
      return await this._nativeModule.requestPermissionsAsync();
    }
  }
}

const defaultPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

export { PermissionStatus };
export type { EventSubscription as Subscription, PermissionResponse, PermissionExpiration };
