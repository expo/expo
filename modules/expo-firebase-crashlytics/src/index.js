/**
 * @flow
 * Crash Reporting representation wrapper
 */
import { ModuleBase, getNativeModule, registerModule } from 'expo-firebase-app';

import type App from 'expo-firebase-app';

export const MODULE_NAME = 'ExpoFirebaseCrashlytics';
export const NAMESPACE = 'crashlytics';

export const statics = {};

export default class Crashlytics extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      moduleName: MODULE_NAME,
      multiApp: false,
      hasShards: false,
      namespace: NAMESPACE,
    });
  }

  /**
   * Forces a crash. Useful for testing your application is set up correctly.
   */
  crash(): void {
    getNativeModule(this).crash();
  }

  /**
   * Logs a message that will appear in any subsequent crash reports.
   * @param {string} message
   */
  log(message: string): void {
    getNativeModule(this).log(message);
  }

  /**
   * Logs a non fatal exception.
   * @param {string} code
   * @param {string} message
   */
  recordError(code: number, message: string): void {
    getNativeModule(this).recordError(code, message);
  }

  /**
   * Set a boolean value to show alongside any subsequent crash reports.
   */
  setBoolValue(key: string, value: boolean): void {
    getNativeModule(this).setBoolValue(key, value);
  }

  /**
   * Set a float value to show alongside any subsequent crash reports.
   */
  setFloatValue(key: string, value: number): void {
    getNativeModule(this).setFloatValue(key, value);
  }

  /**
   * Set an integer value to show alongside any subsequent crash reports.
   */
  setIntValue(key: string, value: number): void {
    getNativeModule(this).setIntValue(key, value);
  }

  /**
   * Set a string value to show alongside any subsequent crash reports.
   */
  setStringValue(key: string, value: string): void {
    getNativeModule(this).setStringValue(key, value);
  }

  /**
   * Set the user ID to show alongside any subsequent crash reports.
   */
  setUserIdentifier(userId: string): void {
    getNativeModule(this).setUserIdentifier(userId);
  }
}

registerModule(Crashlytics);
