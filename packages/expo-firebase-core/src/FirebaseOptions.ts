import Constants from 'expo-constants';

// @docsMissing
export type FirebaseOptions = {
  /**
   * Unique identifier of the Firebase app.
   */
  appId?: string;
  /**
   * Firebase API key.
   */
  apiKey?: string;
  /**
   * Firebase database URL.
   */
  databaseURL?: string;
  /**
   * Tracking identifier for Google Analytics.
   */
  trackingId?: string;
  messagingSenderId?: string;
  /**
   * Google Cloud Storage bucket name.
   */
  storageBucket?: string;
  /**
   * Unique identifier of the Firebase project.
   */
  projectId?: string;
  authDomain?: string;
  measurementId?: string;
};

export function getDefaultWebOptions(): FirebaseOptions | void {
  return Constants.expoConfig?.web?.config?.firebase;
}
