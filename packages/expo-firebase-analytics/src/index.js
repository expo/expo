/**
 * @flow
 * Analytics representation wrapper
 */
import { ModuleBase, getNativeModule, utils, registerModule } from 'expo-firebase-app';
const { isString, isObject } = utils;
import type { App } from 'expo-firebase-app';

const AlphaNumericUnderscore = /^[a-zA-Z0-9_]+$/;

const ReservedEventNames = [
  'app_clear_data',
  'app_uninstall',
  'app_update',
  'error',
  'first_open',
  'in_app_purchase',
  'notification_dismiss',
  'notification_foreground',
  'notification_open',
  'notification_receive',
  'os_update',
  'session_start',
  'user_engagement',
];

export const MODULE_NAME = 'ExpoFirebaseAnalytics';
export const NAMESPACE = 'analytics';
export const statics = {};

export default class Analytics extends ModuleBase {
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
   * Logs an app event.
   * @param  {string} name
   * @param params
   * @return {Promise}
   */
  logEvent(name: string, params: Object = {}): void {
    if (!isString(name)) {
      throw new Error(
        `analytics.logEvent(): First argument 'name' is required and must be a string value.`
      );
    }

    if (typeof params !== 'undefined' && !isObject(params)) {
      throw new Error(
        `analytics.logEvent(): Second optional argument 'params' must be an object if provided.`
      );
    }

    // check name is not a reserved event name
    if (ReservedEventNames.includes(name)) {
      throw new Error(
        `analytics.logEvent(): event name '${name}' is a reserved event name and can not be used.`
      );
    }

    // name format validation
    if (!AlphaNumericUnderscore.test(name)) {
      throw new Error(
        `analytics.logEvent(): Event name '${name}' is invalid. Names should contain 1 to 32 alphanumeric characters or underscores.`
      );
    }

    // maximum number of allowed params check
    if (params && Object.keys(params).length > 25)
      throw new Error('analytics.logEvent(): Maximum number of parameters exceeded (25).');

    // Parameter names can be up to 24 characters long and must start with an alphabetic character
    // and contain only alphanumeric characters and underscores. Only String, long and double param
    // types are supported. String parameter values can be up to 36 characters long. The "firebase_"
    // prefix is reserved and should not be used for parameter names.

    getNativeModule(this).logEvent(name, params);
  }

  /**
   * Sets whether analytics collection is enabled for this app on this device.
   * @param enabled
   */
  setAnalyticsCollectionEnabled(enabled: boolean): void {
    getNativeModule(this).setAnalyticsCollectionEnabled(enabled);
  }

  /**
   * Sets the current screen name, which specifies the current visual context in your app.
   * @param screenName
   * @param screenClassOverride
   */
  setCurrentScreen(screenName: string, screenClassOverride: string): void {
    getNativeModule(this).setCurrentScreen(screenName, screenClassOverride);
  }

  /**
   * Sets the minimum engagement time required before starting a session. The default value is 10000 (10 seconds).
   * @param milliseconds
   */
  setMinimumSessionDuration(milliseconds: number = 10000): void {
    getNativeModule(this).setMinimumSessionDuration(milliseconds);
  }

  /**
   * Sets the duration of inactivity that terminates the current session. The default value is 1800000 (30 minutes).
   * @param milliseconds
   */
  setSessionTimeoutDuration(milliseconds: number = 1800000): void {
    getNativeModule(this).setSessionTimeoutDuration(milliseconds);
  }

  /**
   * Sets the user ID property.
   * @param id
   */
  setUserId(id: string | null): void {
    if (id !== null && !isString(id)) {
      throw new Error('analytics.setUserId(): The supplied userId must be a string value or null.');
    }
    getNativeModule(this).setUserId(id);
  }

  /**
   * Sets a user property to a given value.
   * @param name
   * @param value
   */
  setUserProperty(name: string, value: string | null): void {
    if (value !== null && !isString(value)) {
      throw new Error(
        'analytics.setUserProperty(): The supplied property must be a string value or null.'
      );
    }
    getNativeModule(this).setUserProperty(name, value);
  }

  /**
   * Sets multiple user properties to the supplied values.
   * @EXFirebaseSpecific
   * @param object
   */
  setUserProperties(object: Object): void {
    Object.keys(object).forEach(property => {
      const value = object[property];
      if (value !== null && !isString(value)) {
        throw new Error(
          `analytics.setUserProperties(): The property with name '${property}' must be a string value or null.`
        );
      }
      getNativeModule(this).setUserProperty(property, object[property]);
    });
  }
}

registerModule(Analytics);
