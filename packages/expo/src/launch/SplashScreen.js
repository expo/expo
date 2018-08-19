// @flow

import { NativeModules } from 'react-native';

const { ExponentSplashScreen: SplashScreen } = NativeModules;

export function preventAutoHide() {
  SplashScreen.preventAutoHide();
}

export function hide() {
  SplashScreen.hide();
}
