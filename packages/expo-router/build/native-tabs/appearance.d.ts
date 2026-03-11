import type { ColorValue } from 'react-native';
import type { TabsScreenAppearance, TabsScreenItemStateAppearance } from 'react-native-screens';
import { type NativeTabOptions, type NativeTabsBlurEffect, type NativeTabsLabelStyle } from './types';
export declare function createStandardAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearance;
export declare function createScrollEdgeAppearanceFromOptions(options: NativeTabOptions): TabsScreenAppearance;
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
export declare function appendSelectedStyleToAppearance(selectedStyle: AppearanceStyle, appearance: TabsScreenAppearance): TabsScreenAppearance;
export declare function appendStyleToAppearance(style: AppearanceStyle, appearance: TabsScreenAppearance, states: ('selected' | 'focused' | 'disabled' | 'normal')[]): TabsScreenAppearance;
export declare function convertStyleToAppearance(style: AppearanceStyle | undefined): TabsScreenAppearance;
export declare function convertStyleToItemStateAppearance(style: AppearanceStyle | undefined): TabsScreenItemStateAppearance;
//# sourceMappingURL=appearance.d.ts.map