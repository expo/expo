import { requireNativeModule } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';

import { ExpoDevMenu } from './ExpoDevMenu.types';

const module =
  Platform.OS === 'android' ? requireNativeModule('ExpoDevMenu') : NativeModules.ExpoDevMenu;

export default module as ExpoDevMenu;
