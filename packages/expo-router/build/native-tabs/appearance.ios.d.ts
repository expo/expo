import type { ColorValue } from 'react-native';
import type { TabsScreenAppearanceIOS, TabsScreenItemStateAppearanceIOS } from 'react-native-screens';
import { type NativeTabOptions, type NativeTabsBlurEffect, type NativeTabsLabelStyle } from './types';
/**
 * @internal
 */
export declare function createStandardAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearanceIOS;
/**
 * @internal
 */
export declare function createScrollEdgeAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearanceIOS;
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
export declare function appendSelectedStyleToAppearance(selectedStyle: AppearanceStyle, appearance: TabsScreenAppearanceIOS): TabsScreenAppearanceIOS;
/**
 * @internal
 */
export declare function appendStyleToAppearance(style: AppearanceStyle, appearance: TabsScreenAppearanceIOS, states: ('selected' | 'focused' | 'disabled' | 'normal')[]): TabsScreenAppearanceIOS;
/**
 * @internal
 */
export declare function convertStyleToAppearance(style: AppearanceStyle | undefined): TabsScreenAppearanceIOS;
/**
 * @internal
 */
export declare function convertStyleToItemStateAppearance(style: AppearanceStyle | undefined): TabsScreenItemStateAppearanceIOS;
//# sourceMappingURL=appearance.ios.d.ts.map