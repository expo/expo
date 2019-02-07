import { NativeModulesProxy } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

let { CTKAdSettingsManager } = NativeModulesProxy;

CTKAdSettingsManager = CTKAdSettingsManager || {};

export type AdLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';

// TODO: rewrite the docblocks
export default {
  /**
   * Contains hash of the device id
   */
  get currentDeviceHash(): string | null {
    return CTKAdSettingsManager ? CTKAdSettingsManager.currentDeviceHash : null;
  },

  /**
   * Registers given device with `deviceHash` to receive test Facebook ads.
   */
  addTestDevice(deviceHash: string): void {
    if (!CTKAdSettingsManager.addTestDevice) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'addTestDevice');
    }
    CTKAdSettingsManager.addTestDevice(deviceHash);
  },
  /**
   * Clears previously set test devices
   */
  clearTestDevices(): void {
    if (!CTKAdSettingsManager.clearTestDevices) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'clearTestDevices');
    }
    CTKAdSettingsManager.clearTestDevices();
  },
  /**
   * Sets current SDK log level
   */
  setLogLevel(logLevel: AdLogLevel): void {
    if (!CTKAdSettingsManager.setLogLevel) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'setLogLevel');
    }
    CTKAdSettingsManager.setLogLevel(logLevel);
  },
  /**
   * Specifies whether ads are treated as child-directed
   */
  setIsChildDirected(isDirected: boolean): void {
    if (!CTKAdSettingsManager.setIsChildDirected) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'setIsChildDirected');
    }
    CTKAdSettingsManager.setIsChildDirected(isDirected);
  },
  /**
   * Sets mediation service name
   */
  setMediationService(mediationService: string): void {
    if (!CTKAdSettingsManager.setMediationService) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'setMediationService');
    }
    CTKAdSettingsManager.setMediationService(mediationService);
  },
  /**
   * Sets URL prefix
   */
  setUrlPrefix(urlPrefix: string): void {
    if (!CTKAdSettingsManager.setUrlPrefix) {
      throw new UnavailabilityError('CTKAdSettingsManager', 'setUrlPrefix');
    }
    CTKAdSettingsManager.setUrlPrefix(urlPrefix);
  },
};
