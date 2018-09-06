import { NativeModules } from 'react-native';

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
  NativeModules.ExponentScreenOrientation.allow(orientation);
}
