import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = '@@expo@@';

/**
 * A mock implementation of the native kernel module that can be used when loading Home as a regular
 * project or when running it on web.
 *
 * Longer term, it may make sense to natively define a private, unprivileged implementation of the
 * kernel module and use this implementation only on web.
 */
export default {
  sdkVersions: '',
  sdkVersionsArray: [],

  async getDevMenuSettingsAsync(): Promise<null> {
    return null;
  },

  async setDevMenuSettingAsync(_key: string, _value: any): Promise<void> {},

  async doesCurrentTaskEnableDevtoolsAsync(): Promise<boolean> {
    return false;
  },

  async getDevMenuItemsToShowAsync(): Promise<unknown> {
    return {};
  },

  async selectDevMenuItemWithKeyAsync(_key: string): Promise<void> {},

  async reloadAppAsync(): Promise<void> {},

  async closeDevMenuAsync(): Promise<void> {},

  async goToHomeAsync(): Promise<void> {},

  selectQRReader(): void {},

  async getIsOnboardingFinishedAsync(): Promise<boolean> {
    const item = await AsyncStorage.getItem(`${STORAGE_PREFIX}:onboarding`);
    return !!item;
  },

  async setIsOnboardingFinishedAsync(finished: boolean): Promise<void> {
    if (finished) {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}:onboarding`, '1');
    } else {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}:onboarding`);
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
