import { NativeModules } from 'react-native';

const { ExponentSplashScreen: SplashScreen = {} } = NativeModules;

export async function preventAutoHideAsync(): Promise<boolean> {
  if (SplashScreen.preventAutoHide) {
    SplashScreen.preventAutoHide();
    return true;
  }
  return false;
}

export async function hideAsync(): Promise<boolean> {
  if (SplashScreen.hide) {
    SplashScreen.hide();
    return true;
  }
  return false;
}

/**
 * @deprecated
 */
export function hide(): void {
  console.warn('SplashScreen.hide() is deprecated in favour of SplashScreen.hideAsync()');
  hideAsync();
}

/**
 * @deprecated
 */
export function preventAutoHide(): void {
  console.warn(
    'SplashScreen.preventAutoHide() is deprecated in favour of SplashScreen.preventAutoHideAsync()'
  );
  preventAutoHideAsync();
}
