import { UnavailabilityError } from '@unimodules/core';
import { IFirebaseOptions } from './FirebaseOptions';

export default {
  get DEFAULT_NAME(): string {
    return '[DEFAULT]';
  },

  get DEFAULT_OPTIONS(): IFirebaseOptions {
    throw new UnavailabilityError('expo-firebase-core', 'DEFAULT_OPTIONS');
  },
};
