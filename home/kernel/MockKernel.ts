import { AsyncStorage } from 'react-native';

const STORAGE_PREFIX = '@@expo@@';

/**
 * A mock implementation of the native kernel module that can be used when loading Home as a regular
 * project or when running it on web.
 *
 * Longer term, it may make sense to natively define a private, unprivileged implementation of the
 * kernel module and use this implementation only on web.
 */
export default {
  sdkVersions: [] as string[],

  async doesCurrentTaskEnableDevtools(): Promise<boolean> {
    return false;
  },

  addDevMenu(): void {},

  async getDevMenuItemsToShowAsync(): Promise<unknown> {
    return {};
  },

  selectDevMenuItemWithKey(_key: string): void {},
  selectRefresh(): void {},
  selectCloseMenu(): void {},
  selectGoToHome(): void {},
  selectQRReader(): void {},

  async setIsLegacyMenuBehaviorEnabledAsync(_enabled: boolean): Promise<void> {},

  async getIsNuxFinishedAsync(): Promise<boolean> {
    const item = await AsyncStorage.getItem(`${STORAGE_PREFIX}:nux`);
    return !!item;
  },

  async setIsNuxFinishedAsync(finished: boolean): Promise<void> {
    if (finished) {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}:nux`, '1');
    } else {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}:nux`);
    }
  },

  async getSessionAsync(): Promise<unknown> {
    const json = await AsyncStorage.getItem(`${STORAGE_PREFIX}:session`);
    return json ? JSON.parse(json) : null;
  },

  async setSessionAsync(session: object): Promise<void> {
    const json = JSON.stringify(session);
    await AsyncStorage.setItem(`${STORAGE_PREFIX}:session`, json);
  },

  async removeSessionAsync(): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}:session`);
  },

  onEventSuccess(_eventId: string, _result: object): void {},

  onEventFailure(_eventId: string, _message: string): void {},
};
