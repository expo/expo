import { NativeModulesProxy, UnavailabilityError } from '@unimodules/core';

import { IFirebaseOptions } from './FirebaseOptions';

const { ExpoFirebaseCore } = NativeModulesProxy;

if (!ExpoFirebaseCore) {
  console.warn(
    'No native ExpoFirebaseCore module found, are you sure the expo-firebase-core module is linked properly?'
  );
}

export default {
  get DEFAULT_APP_NAME(): string {
    if (!ExpoFirebaseCore) {
      throw new UnavailabilityError('FirebaseCore', 'DEFAULT_APP_NAME');
    }
    return ExpoFirebaseCore.DEFAULT_APP_NAME;
  },

  get DEFAULT_APP_OPTIONS(): IFirebaseOptions | void {
    if (!ExpoFirebaseCore) {
      throw new UnavailabilityError('FirebaseCore', 'DEFAULT_APP_OPTIONS');
    }
    return ExpoFirebaseCore.DEFAULT_APP_OPTIONS;
  },
};
