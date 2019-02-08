import { ModuleBase } from 'expo-firebase-app';
export const MODULE_NAME = 'ExpoFirebaseCrashlytics';
export const NAMESPACE = 'crashlytics';
export const statics = {};
export default class Crashlytics extends ModuleBase {
    constructor(app) {
        super(app, {
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
    }
    /**
     * Forces a crash. Useful for testing your application is set up correctly.
     */
    crash() {
        this.nativeModule.crash();
    }
    /**
     * Logs a message that will appear in any subsequent crash reports.
     * @param {string} message
     */
    log(message) {
        this.nativeModule.log(message);
    }
    /**
     * Logs a non fatal exception.
     * @param {string} code
     * @param {string} message
     */
    recordError(code, message) {
        this.nativeModule.recordError(code, message);
    }
    /**
     * Set a boolean value to show alongside any subsequent crash reports.
     */
    setBoolValue(key, value) {
        this.nativeModule.setBoolValue(key, value);
    }
    /**
     * Set a float value to show alongside any subsequent crash reports.
     */
    setFloatValue(key, value) {
        this.nativeModule.setFloatValue(key, value);
    }
    /**
     * Set an integer value to show alongside any subsequent crash reports.
     */
    setIntValue(key, value) {
        this.nativeModule.setIntValue(key, value);
    }
    /**
     * Set a string value to show alongside any subsequent crash reports.
     */
    setStringValue(key, value) {
        this.nativeModule.setStringValue(key, value);
    }
    /**
     * Set the user ID to show alongside any subsequent crash reports.
     */
    setUserIdentifier(userId) {
        this.nativeModule.setUserIdentifier(userId);
    }
}
Crashlytics.moduleName = MODULE_NAME;
Crashlytics.namespace = NAMESPACE;
Crashlytics.statics = statics;
//# sourceMappingURL=index.js.map