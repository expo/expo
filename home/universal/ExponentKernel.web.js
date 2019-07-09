import { AsyncStorage } from 'react-native';

export default {
  setIsLegacyMenuBehaviorEnabledAsync() {},
  setIsNuxFinishedAsync() {},
  addDevMenu() {},
  onEventSuccess() {},
  onEventFailure() {},
  setSessionAsync(value) {
    return AsyncStorage.setItem('@Expo:Session', JSON.stringify(value));
  },
  async getSessionAsync() {
    const value = await AsyncStorage.getItem('@Expo:Session');
    if (value) {
      return JSON.parse(value);
    }
    return value;
  },
  sdkVersions: [],
  // openURL() {}
  // IOSClientReleaseType: 'APPLE_APP_STORE',
};
