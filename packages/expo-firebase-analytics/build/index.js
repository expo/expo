import { ModuleBase, utils } from 'expo-firebase-app';
const { isObject } = utils;
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
const isString = (value) => {
    return value != null && typeof value === 'string';
};
export default class Analytics extends ModuleBase {
    constructor(app) {
        super(app, {
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
    }
    /**
     * Logs an app event.
     * @param  {string} name
     * @param params
     * @return {Promise}
     */
    async logEvent(name, params = {}) {
        if (!isString(name)) {
            throw new Error(`analytics.logEvent(): First argument 'name' is required and must be a string value.`);
        }
        if (typeof params !== 'undefined' && !isObject(params)) {
            throw new Error(`analytics.logEvent(): Second optional argument 'params' must be an object if provided.`);
        }
        // check name is not a reserved event name
        if (ReservedEventNames.includes(name)) {
            throw new Error(`analytics.logEvent(): event name '${name}' is a reserved event name and can not be used.`);
        }
        // name format validation
        if (!AlphaNumericUnderscore.test(name)) {
            throw new Error(`analytics.logEvent(): Event name '${name}' is invalid. Names should contain 1 to 32 alphanumeric characters or underscores.`);
        }
        // maximum number of allowed params check
        if (params && Object.keys(params).length > 25)
            throw new Error('analytics.logEvent(): Maximum number of parameters exceeded (25).');
        // Parameter names can be up to 24 characters long and must start with an alphabetic character
        // and contain only alphanumeric characters and underscores. Only String, long and double param
        // types are supported. String parameter values can be up to 36 characters long. The "firebase_"
        // prefix is reserved and should not be used for parameter names.
        await this.nativeModule.logEvent(name, params);
    }
    /**
     * Sets whether analytics collection is enabled for this app on this device.
     * @param enabled
     */
    async setAnalyticsCollectionEnabled(enabled) {
        await this.nativeModule.setAnalyticsCollectionEnabled(enabled);
    }
    /**
     * Sets the current screen name, which specifies the current visual context in your app.
     * @param screenName
     * @param screenClassOverride
     */
    async setCurrentScreen(screenName, screenClassOverride) {
        await this.nativeModule.setCurrentScreen(screenName, screenClassOverride);
    }
    /**
     * Sets the minimum engagement time required before starting a session. The default value is 10000 (10 seconds).
     * @param milliseconds
     */
    async setMinimumSessionDuration(milliseconds = 10000) {
        await this.nativeModule.setMinimumSessionDuration(milliseconds);
    }
    /**
     * Sets the duration of inactivity that terminates the current session. The default value is 1800000 (30 minutes).
     * @param milliseconds
     */
    async setSessionTimeoutDuration(milliseconds = 1800000) {
        await this.nativeModule.setSessionTimeoutDuration(milliseconds);
    }
    /**
     * Sets the user ID property.
     * @param id
     */
    async setUserId(id) {
        if (!isString(id)) {
            throw new Error('analytics.setUserId(): The supplied userId must be a string value or null.');
        }
        await this.nativeModule.setUserId(id);
    }
    /**
     * Sets a user property to a given value.
     * @param name
     * @param value
     */
    async setUserProperty(name, value) {
        if (!isString(value)) {
            throw new Error('analytics.setUserProperty(): The supplied property must be a string value or null.');
        }
        await this.nativeModule.setUserProperty(name, value);
    }
    /**
     * Sets multiple user properties to the supplied values.
     * @param object
     */
    async setUserProperties(object) {
        let tasks = [];
        for (const entry of Object.entries(object)) {
            const [property, value] = entry;
            if (!isString(value)) {
                throw new Error(`analytics.setUserProperties(): The property with name '${property}' must be a string value or null.`);
            }
            tasks.push(this.nativeModule.setUserProperty(property, value));
        }
        await Promise.all(tasks);
    }
}
Analytics.moduleName = MODULE_NAME;
Analytics.namespace = NAMESPACE;
Analytics.statics = statics;
//# sourceMappingURL=index.js.map