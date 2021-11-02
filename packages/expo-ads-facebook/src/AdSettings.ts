import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
  createPermissionHook,
  NativeModulesProxy,
  UnavailabilityError,
} from 'expo-modules-core';
import { Platform } from 'react-native';

const { CTKAdSettingsManager } = NativeModulesProxy;

export type AdLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };

const androidPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!CTKAdSettingsManager.requestPermissionsAsync) {
    throw new UnavailabilityError('expo-ads-facebook', 'requestPermissionsAsync');
  }
  return await CTKAdSettingsManager.requestPermissionsAsync();
}

async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return Promise.resolve(androidPermissionsResponse);
  }

  if (!CTKAdSettingsManager.getPermissionsAsync) {
    throw new UnavailabilityError('expo-ads-facebook', 'getPermissionsAsync');
  }
  return await CTKAdSettingsManager.getPermissionsAsync();
}

// @needsAudit
/**
 * Check or request permissions for ad settings.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = AdSettings.usePermissions();
 * ```
 */
const usePermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
});

// TODO: rewrite the docblocks
export default {
  /**
   * Contains hash of the device id
   */
  get currentDeviceHash(): string {
    return CTKAdSettingsManager.currentDeviceHash;
  },
  requestPermissionsAsync,
  getPermissionsAsync,
  usePermissions,
  /**
   * Sets whether Facebook SDK should enable advertising tracking.
   */
  setAdvertiserTrackingEnabled(enabled: boolean): void {
    // noop outside of iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!CTKAdSettingsManager.setAdvertiserTrackingEnabled) {
      throw new UnavailabilityError('expo-ads-facebook', 'setAdvertiserTrackingEnabled');
    }
    CTKAdSettingsManager.setAdvertiserTrackingEnabled(enabled);
  },

  /**
   * Registers given device with `deviceHash` to receive test Facebook ads.
   */
  addTestDevice(deviceHash: string): void {
    CTKAdSettingsManager.addTestDevice(deviceHash);
  },
  /**
   * Clears previously set test devices
   */
  clearTestDevices(): void {
    CTKAdSettingsManager.clearTestDevices();
  },
  /**
   * Sets current SDK log level
   */
  setLogLevel(logLevel: AdLogLevel): void {
    CTKAdSettingsManager.setLogLevel(logLevel);
  },
  /**
   * Specifies whether ads are treated as child-directed
   */
  setIsChildDirected(isDirected: boolean): void {
    CTKAdSettingsManager.setIsChildDirected(isDirected);
  },
  /**
   * Sets mediation service name
   */
  setMediationService(mediationService: string): void {
    CTKAdSettingsManager.setMediationService(mediationService);
  },
  /**
   * Sets URL prefix
   */
  setUrlPrefix(urlPrefix: string): void {
    CTKAdSettingsManager.setUrlPrefix(urlPrefix || null);
  },
};
