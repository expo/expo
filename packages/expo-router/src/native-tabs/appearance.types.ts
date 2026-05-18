import type { ColorValue } from 'react-native';

import type {
  NativeTabOptions,
  NativeTabsBlurEffect,
  NativeTabsLabelStyle,
  NativeTabsTabBarItemLabelVisibilityMode,
} from './types';

/**
 * @internal
 */
export interface AppearanceStyle extends NativeTabsLabelStyle {
  iconColor?: ColorValue;
  backgroundColor?: ColorValue | null;
  blurEffect?: NativeTabsBlurEffect;
  badgeBackgroundColor?: ColorValue;
  shadowColor?: ColorValue;
  titlePositionAdjustment?: {
    horizontal?: number;
    vertical?: number;
  };
}

/**
 * @internal
 */
export interface BuildAndroidAppearanceArgs {
  options: NativeTabOptions;
  // TODO(@ubax): Move this props into separate options and remove the type
  tintColor: ColorValue | undefined;
  rippleColor: ColorValue | undefined;
  disableIndicator: boolean | undefined;
  labelVisibilityMode: NativeTabsTabBarItemLabelVisibilityMode | undefined;
}
