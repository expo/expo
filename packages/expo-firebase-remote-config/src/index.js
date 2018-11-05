// @flow
import { ModuleBase, registerModule } from 'expo-firebase-app';

import type { App } from 'expo-firebase-app';

type NativeValue = {
  stringValue?: string,
  numberValue?: number,
  dataValue?: Object,
  boolValue?: boolean,
  source: 'remoteConfigSourceRemote' | 'remoteConfigSourceDefault' | ' remoteConfigSourceStatic',
};

export const MODULE_NAME = 'ExpoFirebaseRemoteConfig';
export const NAMESPACE = 'config';
export const statics = {};

type ConfigSnapshot = {
  source: string,
  val(): any,
};

/**
 * @class Config
 */
export default class RemoteConfig extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;
  _developerModeEnabled: boolean;

  constructor(app: App) {
    super(app, {
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE,
    });
    this._developerModeEnabled = false;
  }

  /**
   * Converts a native map to single JS value
   * @param nativeValue
   * @returns {*}
   * @private
   */
  _nativeValueToJS(nativeValue: NativeValue): ConfigSnapshot {
    return {
      source: nativeValue.source,
      val() {
        if (
          nativeValue.boolValue !== null &&
          (nativeValue.stringValue === 'true' ||
            nativeValue.stringValue === 'false' ||
            nativeValue.stringValue === null)
        )
          return nativeValue.boolValue;
        if (
          nativeValue.numberValue !== null &&
          nativeValue.numberValue !== undefined &&
          (nativeValue.stringValue == null ||
            nativeValue.stringValue === '' ||
            nativeValue.numberValue.toString() === nativeValue.stringValue)
        )
          return nativeValue.numberValue;
        if (
          nativeValue.dataValue !== nativeValue.stringValue &&
          (nativeValue.stringValue == null || nativeValue.stringValue === '')
        )
          return nativeValue.dataValue;
        return nativeValue.stringValue;
      },
    };
  }

  /**
   * Enable Remote Config developer mode to allow for frequent refreshes of the cache
   */
  enableDeveloperMode() {
    if (!this._developerModeEnabled) {
      this.logger.debug('Enabled developer mode');
      this.nativeModule.enableDeveloperMode();
      this._developerModeEnabled = true;
    }
  }

  /**
   * Fetches Remote Config data
   * Call activateFetched to make fetched data available in app
   * @returns {*|Promise.<String>}:
   */
  fetch(expiration?: number): Promise<string> {
    if (expiration !== undefined) {
      this.logger.debug(`Fetching remote config data with expiration ${expiration.toString()}`);
      return this.nativeModule.fetchWithExpirationDuration(expiration);
    }
    this.logger.debug('Fetching remote config data');
    return this.nativeModule.fetch();
  }

  /**
   * Applies Fetched Config data to the Active Config
   * @returns {*|Promise.<Bool>}
   * resolves if there was a Fetched Config, and it was activated,
   * rejects if no Fetched Config was found, or the Fetched Config was already activated.
   */
  activateFetched(): Promise<boolean> {
    this.logger.debug('Activating remote config');
    return this.nativeModule.activateFetched();
  }

  /**
   * Gets the config value of the default namespace.
   * @param key: Config key
   * @returns {*|Promise.<Object>}, will always resolve
   * Object looks like
   *  {
   *    "stringValue" : stringValue,
   *    "numberValue" : numberValue,
   *    "dataValue" : dataValue,
   *    "boolValue" : boolValue,
   *    "source" : OneOf<String>(remoteConfigSourceRemote|remoteConfigSourceDefault|remoteConfigSourceStatic)
   *  }
   */
  getValue(key: string): Promise<ConfigSnapshot> {
    return this.nativeModule.getValue(key || '').then(this._nativeValueToJS);
  }

  /**
   * Gets the config value of the default namespace.
   * @param keys: Config key
   * @returns {*|Promise.<Object>}, will always resolve.
   * Result will be a dictionary of key and config objects
   * Object looks like
   *  {
   *    "stringValue" : stringValue,
   *    "numberValue" : numberValue,
   *    "dataValue" : dataValue,
   *    "boolValue" : boolValue,
   *    "source" : OneOf<String>(remoteConfigSourceRemote|remoteConfigSourceDefault|remoteConfigSourceStatic)
   *  }
   */
  getValues(keys: Array<string>): Promise<{ [string]: ConfigSnapshot }> {
    return this.nativeModule.getValues(keys || []).then(nativeValues => {
      const values: { [string]: Object } = {};
      for (let i = 0, len = keys.length; i < len; i++) {
        values[keys[i]] = this._nativeValueToJS(nativeValues[i]);
      }
      return values;
    });
  }

  /**
   * Get the set of parameter keys that start with the given prefix, from the default namespace
   * @param prefix: The key prefix to look for. If prefix is nil or empty, returns all the keys.
   * @returns {*|Promise.<Array<String>>}
   */
  getKeysByPrefix(prefix?: string): Promise<string[]> {
    return this.nativeModule.getKeysByPrefix(prefix);
  }

  /**
   * Sets config defaults for parameter keys and values in the default namespace config.
   * @param defaults: A dictionary mapping a String key to a Object values.
   */
  setDefaults(defaults: Object): void {
    this.nativeModule.setDefaults(defaults);
  }

  /**
   * Sets default configs from plist for default namespace;
   * @param resource: The plist file name or resource ID
   */
  setDefaultsFromResource(resource: string | number): void {
    this.nativeModule.setDefaultsFromResource(resource);
  }
}

registerModule(RemoteConfig);

export type { NativeValue, ConfigSnapshot };
