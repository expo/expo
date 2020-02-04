import ExpoFirebaseCore from './ExpoFirebaseCore';
export * from './FirebaseOptions';

if (!ExpoFirebaseCore) {
  console.warn(
    'No native ExpoFirebaseCore module found, are you sure the expo-firebase-core module is linked properly?'
  );
}

export const { DEFAULT_APP_NAME, DEFAULT_APP_OPTIONS } = ExpoFirebaseCore;
