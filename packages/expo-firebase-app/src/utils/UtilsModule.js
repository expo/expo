// @flow
import { NativeModulesProxy, Platform } from 'expo-core';

import INTERNALS from './internals';
import ModuleBase from './ModuleBase';

import type App from '../app';

const isIOS = Platform.OS === 'ios';

const { ExpoFirebaseApp } = NativeModulesProxy;

type GoogleApiAvailabilityType = {
  status: number,
  isAvailable: boolean,
  isUserResolvableError?: boolean,
  hasResolution?: boolean,
  error?: string,
};

export const MODULE_NAME = 'ExpoFirebaseUtils';
export const NAMESPACE = 'utils';

export const statics = {};

export class ExpoFirebaseUtils extends ModuleBase {
  static namespace = NAMESPACE;
  static moduleName = MODULE_NAME;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE,
    });
  }

  /**
   *
   */
  checkPlayServicesAvailability() {
    if (isIOS) return;

    const { status } = this.playServicesAvailability;

    if (!this.playServicesAvailability.isAvailable) {
      if (
        INTERNALS.OPTIONS.promptOnMissingPlayServices &&
        this.playServicesAvailability.isUserResolvableError
      ) {
        this.promptForPlayServices();
      } else {
        const error = INTERNALS.STRINGS.ERROR_PLAY_SERVICES(status);
        if (INTERNALS.OPTIONS.errorOnMissingPlayServices) {
          if (status === 2) console.warn(error);
          // only warn if it exists but may need an update
          else throw new Error(error);
        } else {
          console.warn(error);
        }
      }
    }
  }

  getPlayServicesStatus(): Promise<GoogleApiAvailabilityType | null> {
    if (isIOS) return Promise.resolve(null);
    return ExpoFirebaseApp.getPlayServicesStatus();
  }

  promptForPlayServices() {
    if (isIOS) return null;
    return ExpoFirebaseApp.promptForPlayServices();
  }

  resolutionForPlayServices() {
    if (isIOS) return null;
    return ExpoFirebaseApp.resolutionForPlayServices();
  }

  makePlayServicesAvailable() {
    if (isIOS) return null;
    return ExpoFirebaseApp.makePlayServicesAvailable();
  }

  /**
   * Set the global logging level for all logs.
   *
   * @param logLevel
   */
  set logLevel(logLevel: string) {
    INTERNALS.OPTIONS.logLevel = logLevel;
  }

  /**
   * Returns props from the android GoogleApiAvailability sdk
   * @android
   * @return {ExpoFirebaseApp.GoogleApiAvailabilityType|{isAvailable: boolean, status: number}}
   */
  get playServicesAvailability(): GoogleApiAvailabilityType {
    return (
      ExpoFirebaseApp.playServicesAvailability || {
        isAvailable: true,
        status: 0,
      }
    );
  }

  /**
   * Enable/Disable throwing an error or warning on detecting a play services problem
   * @android
   * @param bool
   */
  set errorOnMissingPlayServices(bool: boolean) {
    INTERNALS.OPTIONS.errorOnMissingPlayServices = bool;
  }

  /**
   * Enable/Disable automatic prompting of the play services update dialog
   * @android
   * @param bool
   */
  set promptOnMissingPlayServices(bool: boolean) {
    INTERNALS.OPTIONS.promptOnMissingPlayServices = bool;
  }
}

export default ExpoFirebaseUtils;
