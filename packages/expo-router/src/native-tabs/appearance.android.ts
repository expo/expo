import type {
  TabsScreenAppearanceAndroid,
  TabsScreenItemStateAppearanceAndroid,
} from 'react-native-screens';

import { Color } from '../color';
import type { NativeTabOptions } from './types';

export function createAndroidScreenAppearance(
  options: NativeTabOptions
): TabsScreenAppearanceAndroid {
  const labelStyle = options.labelStyle;
  const selectedLabelStyle = options.selectedLabelStyle;
  const tintColor = options.tintColor;

  const normal: TabsScreenItemStateAppearanceAndroid = {
    tabBarItemTitleFontColor: labelStyle?.color ?? Color.android.dynamic.onSurfaceVariant,
    tabBarItemIconColor: options.iconColor ?? Color.android.dynamic.onSurfaceVariant,
  };
  const selected: TabsScreenItemStateAppearanceAndroid = {
    tabBarItemTitleFontColor:
      selectedLabelStyle?.color ??
      labelStyle?.color ??
      tintColor ??
      Color.android.dynamic.onSurface,
    tabBarItemIconColor:
      options.selectedIconColor ??
      options.iconColor ??
      tintColor ??
      Color.android.dynamic.onSecondaryContainer,
  };

  return {
    tabBarBackgroundColor: options.backgroundColor ?? Color.android.dynamic.surfaceContainer,
    tabBarItemRippleColor: options.rippleColor ?? Color.android.dynamic.primary,
    tabBarItemLabelVisibilityMode: options.labelVisibilityMode,
    tabBarItemActiveIndicatorColor:
      options.indicatorColor ?? Color.android.dynamic.secondaryContainer,
    tabBarItemActiveIndicatorEnabled: !options.disableIndicator,
    tabBarItemTitleFontFamily: labelStyle?.fontFamily,
    tabBarItemTitleSmallLabelFontSize: labelStyle?.fontSize,
    tabBarItemTitleLargeLabelFontSize: selectedLabelStyle?.fontSize ?? labelStyle?.fontSize,
    tabBarItemTitleFontWeight: labelStyle?.fontWeight,
    tabBarItemTitleFontStyle: labelStyle?.fontStyle,
    tabBarItemBadgeBackgroundColor: options.badgeBackgroundColor,
    tabBarItemBadgeTextColor: options.badgeTextColor,
    normal,
    selected,
  };
}
