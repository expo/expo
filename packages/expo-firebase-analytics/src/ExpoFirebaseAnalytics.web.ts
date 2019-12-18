// import * as firebase from "firebase/app";
// // side-effect
// import "firebase/analytics";

function getFirebaseModule() {
  try {
    return require('firebase/app');
  } catch ({ message }) {
    throw new Error('Firebase JS SDK is not installed: ' + message);
  }
}
function getAnalyticsModule() {
  try {
    const firebase = getFirebaseModule();
    require('firebase/analytics');
    return firebase.analytics();
  } catch ({ message }) {
    throw new Error('Firebase JS Analytics SDK is not available: ' + message);
  }
}

export default {
  get name(): string {
    return 'ExpoFirebaseAnalytics';
  },
  async initAppAsync(config: { [key: string]: any }): Promise<void> {
    getFirebaseModule().initializeApp(config);
  },
  async deleteAppAsync(config: { [key: string]: any }): Promise<void> {
    getFirebaseModule().deleteApp(config);
  },
  async logEventAsync(name: string, properties?: { [key: string]: any }): Promise<void> {
    getAnalyticsModule().logEvent(name, properties);
  },
  async setAnalyticsCollectionEnabledAsync(isEnabled: boolean): Promise<void> {
    getAnalyticsModule().setAnalyticsCollectionEnabled(isEnabled);
  },
  async setCurrentScreenAsync(screenName: string, screenClassOverride?: string): Promise<void> {
    getAnalyticsModule().setCurrentScreen(screenName, screenClassOverride);
  },
  async setMinimumSessionDurationAsync(millis: number): Promise<void> {
    getAnalyticsModule().setMinimumSessionDuration(millis);
  },
  async setSessionTimeoutDurationAsync(millis: number): Promise<void> {
    getAnalyticsModule().setSessionTimeoutDuration(millis);
  },
  async setUserIdAsync(userId: string): Promise<void> {
    getAnalyticsModule().setUserId(userId);
  },
  async setUserPropertyAsync(name: string, value?: { [key: string]: any }): Promise<void> {
    getAnalyticsModule().setUserProperty(name, value);
  },
  async setUserPropertiesAsync(properties: { [key: string]: any }): Promise<void> {
    getAnalyticsModule().setUserProperties(properties);
  },
  async resetAnalyticsDataAsync(): Promise<void> {
    getAnalyticsModule().resetAnalyticsData();
  },
};
