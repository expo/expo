import type { TabsScreenAppearanceAndroid, TabsScreenAppearanceIOS } from 'react-native-screens';

import type { NativeTabOptions } from './types';

export function createStandardAppearanceFromOptions(
  _options: NativeTabOptions
): TabsScreenAppearanceIOS {
  return {};
}

export function createScrollEdgeAppearanceFromOptions(
  _options: NativeTabOptions
): TabsScreenAppearanceIOS {
  return {};
}

export function createAndroidScreenAppearance(
  _options: NativeTabOptions
): TabsScreenAppearanceAndroid {
  return {} as TabsScreenAppearanceAndroid;
}
