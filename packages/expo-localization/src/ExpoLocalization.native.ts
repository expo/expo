import { NativeModulesProxy, Platform, requireNativeModule } from 'expo-modules-core';

let ExpoLocalization: any = null;
if (Platform.OS === 'android') {
  // On Android, the constants export through JSI module is not yet implemented
  // so we must force the module to load through the proxy module.
  // TODO: (barthap) Get rid of this when we support exporting constants through JSI on Android.
  ExpoLocalization = NativeModulesProxy.ExpoLocalization;
} else {
  ExpoLocalization = requireNativeModule('ExpoLocalization');
}

export default ExpoLocalization;
