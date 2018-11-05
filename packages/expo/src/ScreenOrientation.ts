import { NativeModules } from 'react-native';

const { ExponentScreenOrientation } = NativeModules;

export enum Orientation {
  ALL = 'ALL',
  ALL_BUT_UPSIDE_DOWN = 'ALL_BUT_UPSIDE_DOWN',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
}

export function allow(orientation: Orientation): void {
  console.warn("'ScreenOrientation.allow' is deprecated in favour of 'ScreenOrientation.allowAsync'");
  allowAsync(orientation);
}

export function allowAsync(orientation: Orientation): Promise<void> {
  return ExponentScreenOrientation.allowAsync(orientation);
}

export function doesSupportAsync(orientation: Orientation): Promise<Boolean> {
  return ExponentScreenOrientation.doesSupportAsync(orientation);
}
