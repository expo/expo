import { NativeModules } from 'react-native';

const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;

export function preventAutoHide(): void {
  if (SplashScreen.preventAutoHide) {
    SplashScreen.preventAutoHide();
  }
}

export function hide(): void {
  if (SplashScreen.hide) {
    SplashScreen.hide();
  }
}
