import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
export default Platform.OS === 'android'
    ? requireNativeModule('ExpoScreenOrientation')
    : NativeModulesProxy.ExpoScreenOrientation || {};
//# sourceMappingURL=ExpoScreenOrientation.js.map