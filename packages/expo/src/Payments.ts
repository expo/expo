import { NativeModules, Platform } from 'react-native';

export function initialize() {
  if (!NativeModules.TPSStripeManager && Platform.OS === 'ios') {
    console.warn(
      `We temporarily moved the Expo Payments API to ExpoKit. Please see the SDK 20 release notes for more information: https://blog.expo.io/expo-sdk-v20-0-0-is-now-available-79f84232a9d1`
    );
  }
};

if (NativeModules.TPSStripeManager && Platform.OS === 'ios') {
  // @ts-ignore fix this by turning these export assigments into export statements and use separate
  // .ios and .android files 
  module.exports = NativeModules.TPSStripeManager;
} else {
  // @ts-ignore
  module.exports = NativeModules.StripeModule;
}
