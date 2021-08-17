import { Platform } from 'expo-modules-core';
export default {
  get name(): string {
    return 'ExpoAppAuth';
  },
  get OAuthRedirect(): string {
    return Platform.isDOMAvailable ? window.location.href : '';
  },
};
