import type { ColorValue } from 'react-native';
import type { TabsScreenAppearanceAndroid, TabsScreenAppearanceIOS, TabsScreenItemStateAppearanceIOS } from 'react-native-screens';
import { type NativeTabOptions, type NativeTabsBlurEffect, type NativeTabsLabelStyle, type NativeTabsTabBarItemLabelVisibilityMode } from './types';
export declare function createStandardAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearanceIOS;
export declare function createScrollEdgeAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearanceIOS;
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
export declare function appendSelectedStyleToAppearance(selectedStyle: AppearanceStyle, appearance: TabsScreenAppearanceIOS): TabsScreenAppearanceIOS;
export declare function appendStyleToAppearance(style: AppearanceStyle, appearance: TabsScreenAppearanceIOS, states: ('selected' | 'focused' | 'disabled' | 'normal')[]): TabsScreenAppearanceIOS;
export declare function convertStyleToAppearance(style: AppearanceStyle | undefined): TabsScreenAppearanceIOS;
export declare function convertStyleToItemStateAppearance(style: AppearanceStyle | undefined): TabsScreenItemStateAppearanceIOS;
interface BuildAndroidAppearanceArgs {
    options: NativeTabOptions;
    tintColor: ColorValue | undefined;
    rippleColor: ColorValue | undefined;
    disableIndicator: boolean | undefined;
    labelVisibilityMode: NativeTabsTabBarItemLabelVisibilityMode | undefined;
}
export declare function createAndroidScreenAppearance({ options, tintColor, rippleColor, disableIndicator, labelVisibilityMode, }: BuildAndroidAppearanceArgs): TabsScreenAppearanceAndroid;
export {};
//# sourceMappingURL=appearance.d.ts.map