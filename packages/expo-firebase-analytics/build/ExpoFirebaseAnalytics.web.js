import { DEFAULT_APP_OPTIONS } from 'expo-firebase-core';
import { CodedError } from 'expo-modules-core';
function getFirebaseModule() {
    try {
        const firebaseModule = require('firebase/compat/app');
        const firebase = firebaseModule.initializeApp ? firebaseModule : firebaseModule.default;
        if (DEFAULT_APP_OPTIONS && !firebase.apps.length) {
            firebase.initializeApp(DEFAULT_APP_OPTIONS);
        }
        return firebase;
    }
    catch ({ message }) {
        throw new Error('Firebase JS SDK is not installed: ' + message);
    }
}
function getAnalyticsModule() {
    try {
        const firebase = getFirebaseModule();
        require('firebase/compat/analytics');
        return firebase.analytics();
    }
    catch ({ message }) {
        throw new Error('Firebase JS Analytics SDK is not available: ' + message);
    }
}
export default {
    get name() {
        return 'ExpoFirebaseAnalytics';
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    async logEvent(name, properties) {
        getAnalyticsModule().logEvent(name, properties);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    async setAnalyticsCollectionEnabled(isEnabled) {
        getAnalyticsModule().setAnalyticsCollectionEnabled(isEnabled);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    async setCurrentScreen(screenName, screenClassOverride) {
        getAnalyticsModule().setCurrentScreen(screenName);
        // On web, calling `setCurrentScreen` does not automatically record a screen_view event as
        // it does on native. We therefore record the 'screen_view' event manually.
        // https://stackoverflow.com/questions/59330467/how-to-track-page-view-with-firebase-analytics-in-a-web-single-page-app
        if (screenName) {
            getAnalyticsModule().logEvent('screen_view', {
                screen_name: screenName,
            });
        }
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    async setUserId(userId) {
        getAnalyticsModule().setUserId(userId);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    async setUserProperties(properties) {
        getAnalyticsModule().setUserProperties(properties);
    },
    /**
     * No implementation on web
     */
    setUnavailabilityLogging(isEnabled) {
        // nop
    },
    /**
     * Not supported on web
     */
    async setDebugModeEnabled(isEnabled) {
        throw new CodedError('ERR_FIREBASE_NOTCONFIGURED', `setDebugModeEnabled is not available on the web. See "https://firebase.google.com/docs/analytics/debugview" on how to enable debug mode.`);
    },
};
//# sourceMappingURL=ExpoFirebaseAnalytics.web.js.map