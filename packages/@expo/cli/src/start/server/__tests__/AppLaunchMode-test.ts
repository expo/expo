import { AppLaunchMode } from '../AppLaunchMode';

describe('AppLaunchMode', () => {
  describe('valueOf', () => {
    it('returns the corresponding enum value for a valid string', () => {
      expect(AppLaunchMode.valueOf('start')).toBe(AppLaunchMode.Start);
      expect(AppLaunchMode.valueOf('open-deep-link-dev-client')).toBe(
        AppLaunchMode.OpenDeepLinkDevClient
      );
      expect(AppLaunchMode.valueOf('open-deep-link-expo-go')).toBe(
        AppLaunchMode.OpenDeepLinkExpoGo
      );
      expect(AppLaunchMode.valueOf('open-redirect-page')).toBe(AppLaunchMode.OpenRedirectPage);
    });

    it('returns undefined for an invalid string', () => {
      expect(AppLaunchMode.valueOf('invalid-mode')).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('returns the string value of the enum', () => {
      expect(AppLaunchMode.Start.toString()).toBe('start');
      expect(AppLaunchMode.OpenDeepLinkDevClient.toString()).toBe('open-deep-link-dev-client');
      expect(AppLaunchMode.OpenDeepLinkExpoGo.toString()).toBe('open-deep-link-expo-go');
      expect(AppLaunchMode.OpenRedirectPage.toString()).toBe('open-redirect-page');
    });
  });
});
