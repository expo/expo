import type { ColorValue } from 'react-native';
import type { BottomTabsScreenAppearance, BottomTabsScreenItemStateAppearance } from 'react-native-screens';
import { type NativeTabOptions, type NativeTabsBlurEffect, type NativeTabsLabelStyle } from './types';
export declare function createStandardAppearanceFromOptions(options: NativeTabOptions, baseStandardAppearance: BottomTabsScreenAppearance): BottomTabsScreenAppearance;
export declare function createScrollEdgeAppearanceFromOptions(options: NativeTabOptions, baseScrollEdgeAppearance: BottomTabsScreenAppearance): BottomTabsScreenAppearance;
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
export declare function appendSelectedStyleToAppearance(selectedStyle: AppearanceStyle, appearance: BottomTabsScreenAppearance): BottomTabsScreenAppearance;
export declare function appendStyleToAppearance(style: AppearanceStyle, appearance: BottomTabsScreenAppearance, states: ('selected' | 'focused' | 'disabled' | 'normal')[]): BottomTabsScreenAppearance;
export declare function convertStyleToAppearance(style: AppearanceStyle | undefined): BottomTabsScreenAppearance;
export declare function convertStyleToItemStateAppearance(style: AppearanceStyle | undefined): BottomTabsScreenItemStateAppearance;
//# sourceMappingURL=appearance.d.ts.map