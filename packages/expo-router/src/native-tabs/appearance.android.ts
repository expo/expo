import type {
  TabsScreenAppearanceAndroid,
  TabsScreenItemStateAppearanceAndroid,
} from 'react-native-screens';

import type { BuildAndroidAppearanceArgs } from './appearance.types';
import { Color } from '../color';

export function createAndroidScreenAppearance({
  options,
  tintColor,
  rippleColor,
  disableIndicator,
  labelVisibilityMode,
}: BuildAndroidAppearanceArgs): TabsScreenAppearanceAndroid {
  const labelStyle = options.labelStyle;
  const selectedLabelStyle = options.selectedLabelStyle;

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
    tabBarItemRippleColor: rippleColor ?? Color.android.dynamic.primary,
    tabBarItemLabelVisibilityMode: labelVisibilityMode,
    tabBarItemActiveIndicatorColor:
      options.indicatorColor ?? Color.android.dynamic.secondaryContainer,
    tabBarItemActiveIndicatorEnabled: !disableIndicator,
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
