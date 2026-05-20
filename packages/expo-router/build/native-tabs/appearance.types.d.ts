import type { ColorValue } from 'react-native';
import type { NativeTabOptions, NativeTabsBlurEffect, NativeTabsLabelStyle, NativeTabsTabBarItemLabelVisibilityMode } from './types';
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
    tintColor: ColorValue | undefined;
    rippleColor: ColorValue | undefined;
    disableIndicator: boolean | undefined;
    labelVisibilityMode: NativeTabsTabBarItemLabelVisibilityMode | undefined;
}
//# sourceMappingURL=appearance.types.d.ts.map