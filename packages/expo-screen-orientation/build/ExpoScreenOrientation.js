import { requireNativeModule, NativeModulesProxy } from 'expo-modules-core';
import { Platform } from 'react-native';
export default Platform.OS === 'ios'
    ? requireNativeModule('ExpoScreenOrientation')
    : NativeModulesProxy.ExpoScreenOrientation || {};
//# sourceMappingURL=ExpoScreenOrientation.js.map