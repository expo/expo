// @flow

import { NativeModules } from 'react-native';

export default function apisAreAvailable(): boolean {
  return !!NativeModules.ExponentConstants;
}
