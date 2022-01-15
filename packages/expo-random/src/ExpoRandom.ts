import { requireNativeModule } from 'expo-modules-core';
import { NativeModules } from 'react-native';

/**
 * `expo-random` is an Expo module only on iOS, so we need to catch an error from
 * `requireNativeModule`  on Android and fall back to use the original React Native module.
 */
function getExpoRandomModule() {
  try {
    return requireNativeModule('ExpoRandom');
  } catch {
    return NativeModules.ExpoRandom;
  }
}

export default getExpoRandomModule();
