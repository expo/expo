import { FirebaseOptions, getDefaultWebOptions } from './FirebaseOptions';

export default {
  get DEFAULT_APP_NAME(): string {
    return '[DEFAULT]';
  },

  get DEFAULT_APP_OPTIONS(): FirebaseOptions | void {
    return getDefaultWebOptions();
  },
};
