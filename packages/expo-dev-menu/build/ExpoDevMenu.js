import { requireNativeModule } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';
const module = Platform.OS === 'android' ? requireNativeModule('ExpoDevMenu') : NativeModules.ExpoDevMenu;
export default module;
//# sourceMappingURL=ExpoDevMenu.js.map