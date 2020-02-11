import { Platform } from 'react-native';
import { NativeModulesProxy, UnavailabilityError, CodedError } from '@unimodules/core';
import { DEFAULT_APP_NAME, DEFAULT_APP_OPTIONS } from 'expo-firebase-core';
const { ExpoFirebaseAnalytics } = NativeModulesProxy;
if (!ExpoFirebaseAnalytics) {
    console.warn("No native ExpoFirebaseAnalytics module found, are you sure the expo-firebase-analytics's module is linked properly?");
}
let isUnavailabilityLoggingEnabled = true;
let isUnavailabilityWarningLogged = false;
function callAnalyticsModule(funcName, ...args) {
    if (!ExpoFirebaseAnalytics[funcName]) {
        throw new UnavailabilityError('expo-firebase-analytics', funcName);
    }
    if (!DEFAULT_APP_OPTIONS) {
        throw new CodedError('ERR_FIREBASE_NOTCONFIGURED', `Firebase is not configured. Ensure that you have configured '${Platform.select({
            ios: 'GoogleService-Info.plist',
            android: 'google-services.json',
        })}' correctly.`);
    }
    // Analytics is only available for the [DEFAULT] app. On the Expo client
    // a sandboxed app is returned which does not support analytics.
    // In that case we show a warning and log the analytics events to the console.
    // The user can disable these by calling `setUnavailabilityLogging(false)`.
    if (DEFAULT_APP_NAME !== '[DEFAULT]') {
        if (isUnavailabilityLoggingEnabled) {
            if (!isUnavailabilityWarningLogged) {
                console.warn('Firebase Analytics is not available in the Expo client. To test Firebase Analytics create a stand-alone build or custom client. To suppress this warning use `setUnavailabilityLogging(false)`.');
                isUnavailabilityWarningLogged = true;
            }
            console.info(`ExpoFirebaseAnalytics.${funcName}: ${JSON.stringify(args)}`);
        }
        return;
    }
    // Make the call
    return ExpoFirebaseAnalytics[funcName].call(ExpoFirebaseAnalytics, ...args);
}
export default {
    get name() {
        return 'ExpoFirebaseAnalytics';
    },
    async logEvent(name, properties) {
        return callAnalyticsModule('logEvent', name, properties);
    },
    async setAnalyticsCollectionEnabled(isEnabled) {
        return callAnalyticsModule('setAnalyticsEnabled', isEnabled);
    },
    async setCurrentScreen(screenName, screenClassOverride) {
        return callAnalyticsModule('setCurrentScreen', screenName, screenClassOverride);
    },
    async setSessionTimeoutDuration(sessionTimeoutInterval) {
        return callAnalyticsModule('setSessionTimeoutDuration', sessionTimeoutInterval);
    },
    async setUserId(userId) {
        return callAnalyticsModule('setUserId', userId);
    },
    async setUserProperties(properties) {
        return callAnalyticsModule('setUserProperties', properties);
    },
    async resetAnalyticsData() {
        return callAnalyticsModule('resetAnalyticsData');
    },
    setUnavailabilityLogging(isEnabled) {
        isUnavailabilityLoggingEnabled = isEnabled;
    },
};
//# sourceMappingURL=ExpoFirebaseAnalytics.js.map