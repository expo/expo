import { NativeModules } from 'react-native';

const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;

export function preventAutoHideAsync(): void {
  if (SplashScreen.preventAutoHide) {
    SplashScreen.preventAutoHide();
  }
}

export function hideAsync(): void {
  if (SplashScreen.hide) {
    SplashScreen.hide();
  }
}
