import { NativeModulesProxy } from '@unimodules/core';

const { CTKAdSettingsManager } = NativeModulesProxy;

export type AdLogLevel = 'none' | 'debug' | 'verbose' | 'warning' | 'error' | 'notification';

// TODO: rewrite the docblocks
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
    CTKAdSettingsManager.setUrlPrefix(urlPrefix);
  },
};
