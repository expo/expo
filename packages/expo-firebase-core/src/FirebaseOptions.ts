import Constants from 'expo-constants';

// @docsMissing
export type IFirebaseOptions = {
  /**
   * Unique identifier of the Firebase app.
   */
  appId: string;
  /**
   * Firebase API key.
   */
  apiKey: string;
  /**
   * Firebase database URL.
   */
  databaseURL: string;
  /**
   * Tracking identifier for Google Analytics.
   */
  trackingId: string;
  messagingSenderId: string;
  /**
   * Google Cloud Storage bucket name.
   */
  storageBucket: string;
  /**
   * Unique identifier of the Firebase project.
   */
  projectId: string;
  authDomain: string;
  measurementId: string;
};

export function getDefaultWebOptions(): Partial<IFirebaseOptions> | void {
  return (
    Constants.manifest?.web?.config?.firebase ??
    Constants.manifest2?.extra?.expoClient?.web?.config?.firebase
  );
}
