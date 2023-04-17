import { Platform } from 'react-native';
import { requireNativeModule, NativeModulesProxy } from 'expo-modules-core';

export default Platform.OS === 'ios'
  ? requireNativeModule('ExpoScreenOrientation')
  : NativeModulesProxy.ExpoScreenOrientation || {};
