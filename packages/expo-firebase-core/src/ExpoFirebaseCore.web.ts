import { UnavailabilityError } from '@unimodules/core';
import { IFirebaseOptions } from './FirebaseOptions';

export default {
  get DEFAULT_APP_NAME(): string {
    return '[DEFAULT]';
  },

  get DEFAULT_APP_OPTIONS(): IFirebaseOptions {
    throw new UnavailabilityError('expo-firebase-core', 'DEFAULT_APP_OPTIONS');
  },
};
