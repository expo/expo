// @flow

import { NativeModules } from 'react-native';

const { CTKAdSettingsManager } = NativeModules;

type SDKLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';

export default {
  /**
   * Contains hash of the device id
   */
  get currentDeviceHash(): string {
    return CTKAdSettingsManager.currentDeviceHash;
  },

  /**
   * Registers given device with `deviceHash` to receive test Facebook ads.
   */
  addTestDevice(deviceHash: string) {
    CTKAdSettingsManager.addTestDevice(deviceHash);
  },
  /**
   * Clears previously set test devices
   */
  clearTestDevices() {
    CTKAdSettingsManager.clearTestDevices();
  },
  /**
   * Sets current SDK log level
   */
  setLogLevel(logLevel: SDKLogLevel) {
    CTKAdSettingsManager.setLogLevel(logLevel);
  },
  /**
   * Specifies whether ads are treated as child-directed
   */
  setIsChildDirected(isDirected: boolean) {
    CTKAdSettingsManager.setIsChildDirected(isDirected);
  },
  /**
   * Sets mediation service name
   */
  setMediationService(mediationService: string) {
    CTKAdSettingsManager.setMediationService(mediationService);
  },
  /**
   * Sets URL prefix
   */
  setUrlPrefix(urlPrefix: string) {
    CTKAdSettingsManager.setUrlPrefix(urlPrefix);
  },
};
