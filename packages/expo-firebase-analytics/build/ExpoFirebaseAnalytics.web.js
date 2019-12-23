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
    async initAppAsync(config) {
        getFirebaseModule().initializeApp(config);
    },
    async deleteAppAsync(config) {
        getFirebaseModule().deleteApp(config);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    async logEventAsync(name, properties) {
        getAnalyticsModule().logEvent(name, properties);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    async setAnalyticsCollectionEnabledAsync(isEnabled) {
        getAnalyticsModule().setAnalyticsCollectionEnabled(isEnabled);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    async setCurrentScreenAsync(screenName, screenClassOverride) {
        getAnalyticsModule().setCurrentScreen(screenName, screenClassOverride);
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    async setUserIdAsync(userId) {
        getAnalyticsModule().setUserId(userId);
    },
    async setUserPropertyAsync(name, value) {
        getAnalyticsModule().setUserProperties({ [name]: value });
    },
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    async setUserPropertiesAsync(properties) {
        getAnalyticsModule().setUserProperties(properties);
    },
};
//# sourceMappingURL=ExpoFirebaseAnalytics.web.js.map