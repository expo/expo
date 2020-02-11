// import * as firebase from "firebase/app";
// // side-effect
// import "firebase/analytics";
function getFirebaseModule() {
    try {
        return require('firebase/app');
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