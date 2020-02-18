import { DEFAULT_APP_OPTIONS } from 'expo-firebase-core';
function getFirebaseModule() {
    try {
        const firebase = require('firebase/app');
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
        require('firebase/analytics');
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
        getAnalyticsModule().setCurrentScreen(screenName, screenClassOverride);
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
};
//# sourceMappingURL=ExpoFirebaseAnalytics.web.js.map