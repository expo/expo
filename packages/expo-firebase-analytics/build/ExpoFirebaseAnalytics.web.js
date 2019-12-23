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
    async logEventAsync(name, properties) {
        getAnalyticsModule().logEvent(name, properties);
    },
    async setAnalyticsCollectionEnabledAsync(isEnabled) {
        getAnalyticsModule().setAnalyticsCollectionEnabled(isEnabled);
    },
    async setCurrentScreenAsync(screenName, screenClassOverride) {
        getAnalyticsModule().setCurrentScreen(screenName, screenClassOverride);
    },
    async setMinimumSessionDurationAsync(millis) {
        getAnalyticsModule().setMinimumSessionDuration(millis);
    },
    async setSessionTimeoutDurationAsync(millis) {
        getAnalyticsModule().setSessionTimeoutDuration(millis);
    },
    async setUserIdAsync(userId) {
        getAnalyticsModule().setUserId(userId);
    },
    async setUserPropertyAsync(name, value) {
        getAnalyticsModule().setUserProperty(name, value);
    },
    async setUserPropertiesAsync(properties) {
        getAnalyticsModule().setUserProperties(properties);
    },
    async resetAnalyticsDataAsync() {
        getAnalyticsModule().resetAnalyticsData();
    },
};
//# sourceMappingURL=ExpoFirebaseAnalytics.web.js.map