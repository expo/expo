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
  } catch ({ message }) {
    throw new Error('Firebase JS SDK is not installed: ' + message);
  }
}
function getAnalyticsModule() {
  try {
    const firebase = getFirebaseModule();
    require('firebase/compat/analytics');
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
   * Not supported on web, this method is a no-op
   */
  async setSessionTimeoutDuration(_sessionTimeoutInterval: number): Promise<void> {
    // no-op
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
  /**
   * Not supported on web
   */
  async setDebugModeEnabled(isEnabled: boolean): Promise<void> {
    throw new CodedError(
      'ERR_FIREBASE_NOTCONFIGURED',
      `setDebugModeEnabled is not available on the web. See "https://firebase.google.com/docs/analytics/debugview" on how to enable debug mode.`
    );
  },
};
