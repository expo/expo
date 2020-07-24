import { NativeModules } from 'react-native';

const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;

export function preventAutoHideAsync(): void {
  if (SplashScreen.preventAutoHideAsync) {
    SplashScreen.preventAutoHideAsync();
  }
}

export function hideAsync(): void {
  if (SplashScreen.hideAsync) {
    SplashScreen.hideAsync();
  }
}
