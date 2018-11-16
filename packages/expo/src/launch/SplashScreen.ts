import { NativeModules, Platform } from 'react-native';

const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;

const isWeb = Platform.OS === 'web';

export function preventAutoHide() {
  if (!isWeb) {
    SplashScreen.preventAutoHide();
  }
}

export function hide() {
  if (!isWeb) {
    SplashScreen.hide();
  }
}
