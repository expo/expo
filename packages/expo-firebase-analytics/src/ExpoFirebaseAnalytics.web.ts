import { DEFAULT_APP_OPTIONS } from 'expo-firebase-core';

function getFirebaseModule() {
  try {
    const firebase = require('firebase/app');
    if (DEFAULT_APP_OPTIONS && !firebase.apps.length) {
      firebase.initializeApp(DEFAULT_APP_OPTIONS);
    }
    return firebase;
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
  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
   */
  async logEvent(name: string, properties?: { [key: string]: any }): Promise<void> {
    getAnalyticsModule().logEvent(name, properties);
  },
  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
   */
  async setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void> {
    getAnalyticsModule().setAnalyticsCollectionEnabled(isEnabled);
  },
  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
   */
  async setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void> {
    getAnalyticsModule().setCurrentScreen(screenName, screenClassOverride);
  },
  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
   */
  async setUserId(userId: string | null): Promise<void> {
    getAnalyticsModule().setUserId(userId);
  },
  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
   */
  async setUserProperties(properties: { [key: string]: any }): Promise<void> {
    getAnalyticsModule().setUserProperties(properties);
  },
  /**
   * No implementation on web
   */
  setUnavailabilityLogging(isEnabled: boolean): void {
    // nop
  },
};
