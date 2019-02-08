import { App, ModuleBase } from 'expo-firebase-app';
export declare const MODULE_NAME = "ExpoFirebaseAnalytics";
export declare const NAMESPACE = "analytics";
export declare const statics: {};
export default class Analytics extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {};
    constructor(app: App);
    /**
     * Logs an app event.
     * @param  {string} name
     * @param params
     * @return {Promise}
     */
    logEvent(name: string, params?: Object): Promise<void>;
    /**
     * Sets whether analytics collection is enabled for this app on this device.
     * @param enabled
     */
    setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
    /**
     * Sets the current screen name, which specifies the current visual context in your app.
     * @param screenName
     * @param screenClassOverride
     */
    setCurrentScreen(screenName: string, screenClassOverride?: string): Promise<void>;
    /**
     * Sets the minimum engagement time required before starting a session. The default value is 10000 (10 seconds).
     * @param milliseconds
     */
    setMinimumSessionDuration(milliseconds?: number): Promise<void>;
    /**
     * Sets the duration of inactivity that terminates the current session. The default value is 1800000 (30 minutes).
     * @param milliseconds
     */
    setSessionTimeoutDuration(milliseconds?: number): Promise<void>;
    /**
     * Sets the user ID property.
     * @param id
     */
    setUserId(id: string | null): Promise<void>;
    /**
     * Sets a user property to a given value.
     * @param name
     * @param value
     */
    setUserProperty(name: string, value: string | null): Promise<void>;
    /**
     * Sets multiple user properties to the supplied values.
     * @param object
     */
    setUserProperties(object: Object): Promise<void>;
}
