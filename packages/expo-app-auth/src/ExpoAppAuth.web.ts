import { Platform } from '@unimodules/core';
export default {
  get name(): string {
    return 'ExpoAppAuth';
  },
  get OAuthRedirect(): string {
    return Platform.isDOMAvailable ? window.location.href : '';
  },
};
