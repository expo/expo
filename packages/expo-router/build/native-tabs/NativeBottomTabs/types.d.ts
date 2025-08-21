import type { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import type { ColorValue, ImageSourcePropType, TextStyle } from 'react-native';
import type { BottomTabsScreenProps, BottomTabsSystemItem } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface NativeTabOptions extends DefaultRouterOptions {
    /**
     * The icon to display in the tab bar.
     * @platform android
     * @platform iOS
     */
    icon?: SfSymbolOrImageSource & {
        /**
         * The name of the drawable resource to use as an icon.
         * @platform android
         */
        drawable?: string;
    };
    /**
     * The icon to display when the tab is selected.
     * @platform iOS
     */
    selectedIcon?: SfSymbolOrImageSource;
    /**
     * Title of the tab screen, displayed in the tab bar item.
     *
     * @platform android
     * @platform iOS
     */
    title?: string;
    /**
     * Specifies content of tab bar item badge.
     *
     * On Android, the value is interpreted in the following order:
     * - If the string can be parsed to integer, displays the value as a number
     * - Otherwise if the string is empty, displays "small dot" badge
     * - Otherwise, displays the value as a text
     *
     * On iOS, badge is displayed as regular string.
     *
     * @platform android
     * @platform ios
     */
    badgeValue?: string;
    /**
     * @platform ios
     */
    selectedLabelStyle?: NativeTabsLabelStyle;
    /**
     * @platform ios
     */
    role?: BottomTabsSystemItem;
    selectedIconColor?: TypeOrRecord<ColorValue, 'standard' | 'scrollEdge'>;
    selectedBadgeBackgroundColor?: TypeOrRecord<ColorValue, 'standard' | 'scrollEdge'>;
    selectedBackgroundColor?: TypeOrRecord<ColorValue, 'standard' | 'scrollEdge'>;
    selectedTitlePositionAdjustment?: TypeOrRecord<{
        horizontal?: number;
        vertical?: number;
    }, 'standard' | 'scrollEdge'>;
}
export type SfSymbolOrImageSource = {
    /**
     * The name of the SF Symbol to use as an icon.
     * @platform iOS
     */
    sf?: SFSymbol;
} | {
    /**
     * The image source to use as an icon.
     * @platform iOS
     */
    src?: ImageSourcePropType;
};
export interface ExtendedNativeTabOptions extends NativeTabOptions {
    /**
     * If true, the tab will be hidden from the tab bar.
     */
    hidden?: boolean;
    specialEffects?: BottomTabsScreenProps['specialEffects'];
}
type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export interface NativeTabsLabelStyle {
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: NumericFontWeight | `${NumericFontWeight}`;
    fontStyle?: TextStyle['fontStyle'];
    color?: TextStyle['color'];
}
export declare const SUPPORTED_BLUR_EFFECTS: readonly ["none", "systemDefault", "extraLight", "light", "dark", "regular", "prominent", "systemUltraThinMaterial", "systemThinMaterial", "systemMaterial", "systemThickMaterial", "systemChromeMaterial", "systemUltraThinMaterialLight", "systemThinMaterialLight", "systemMaterialLight", "systemThickMaterialLight", "systemChromeMaterialLight", "systemUltraThinMaterialDark", "systemThinMaterialDark", "systemMaterialDark", "systemThickMaterialDark", "systemChromeMaterialDark"];
/**
 * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiblureffect/style)
 */
export type NativeTabsBlurEffect = (typeof SUPPORTED_BLUR_EFFECTS)[number];
/**
 * @platform android
 * @platform web
 */
export interface NativeTabsActiveStyleType {
    /**
     * @platform android
     * @platform web
     */
    color?: ColorValue;
    /**
     * @platform android
     * @platform web
     */
    fontSize?: TextStyle['fontSize'];
    /**
     * @platform android
     */
    iconColor?: ColorValue;
    /**
     * @platform android
     * @platform web
     */
    indicatorColor?: ColorValue;
}
export type TypeOrRecord<T, K extends string> = T | {
    [key in K]: T;
};
export interface NativeTabsProps extends PropsWithChildren {
    labelStyle?: NativeTabsLabelStyle;
    iconColor?: TypeOrRecord<ColorValue, 'standard' | 'disabled'>;
    tintColor?: ColorValue;
    backgroundColor?: ColorValue | null;
    badgeBackgroundColor?: TypeOrRecord<ColorValue, 'standard' | 'disabled'>;
    /**
     * Specifies the minimize behavior for the tab bar.
     *
     * Available starting from iOS 26.
     *
     * The following values are currently supported:
     *
     * - `automatic` - resolves to the system default minimize behavior
     * - `never` - the tab bar does not minimize
     * - `onScrollDown` - the tab bar minimizes when scrolling down and
     *   expands when scrolling back up
     * - `onScrollUp` - the tab bar minimizes when scrolling up and expands
     *   when scrolling back down
     *
     * @see The supported values correspond to the official [UIKit documentation](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior).
     *
     * @default automatic
     *
     * @platform iOS 26+
     */
    minimizeBehavior?: NativeTabsTabBarMinimizeBehavior;
    blurEffect?: NativeTabsBlurEffect;
    /**
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uitabbaritem/titlepositionadjustment)
     *
     * @platform iOS
     */
    titlePositionAdjustment?: {
        horizontal?: number;
        vertical?: number;
    };
    /**
     * Disables the active indicator for the tab bar.
     *
     * @platform android
     */
    disableIndicator?: boolean;
    /**
     * The behavior when navigating back with the back button.
     *
     * @platform android
     */
    backBehavior?: 'none' | 'initialRoute' | 'history';
    labelVisibilityMode?: NativeTabsTabBarItemLabelVisibilityMode;
    rippleColor?: ColorValue;
    indicatorColor?: ColorValue;
    badgeTextColor?: ColorValue;
}
export interface NativeTabsViewProps extends NativeTabsProps {
    focusedIndex: number;
    scrollEdgeAppearanceProps: NativeTabsScrollEdgeAppearanceProps | undefined;
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabOptions, Record<string, any>>>;
}
export declare const SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES: readonly ["auto", "selected", "labeled", "unlabeled"];
/**
 * @see [Material Components documentation](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md#making-navigation-bar-accessible)
 *
 * @platform android
 */
export type NativeTabsTabBarItemLabelVisibilityMode = (typeof SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES)[number];
export declare const SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS: readonly ["automatic", "never", "onScrollDown", "onScrollUp"];
/**
 * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior)
 *
 * @platform iOS 26
 */
export type NativeTabsTabBarMinimizeBehavior = (typeof SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS)[number];
export interface NativeTabTriggerProps {
    /**
     * The name of the route.
     *
     * This is required when used inside a Layout component.
     *
     * When used in a route it has no effect.
     */
    name?: string;
    /**
     * If true, the tab will be hidden from the tab bar.
     */
    hidden?: boolean;
    /**
     * The options for the trigger.
     *
     * Use `Icon`, `Label`, and `Badge` components as children to customize the tab, rather then raw options.
     */
    options?: NativeTabOptions;
    /**
     * If true, the tab will not pop stack to the root when selected again.
     *
     * @default false
     * @platform iOS
     */
    disablePopToTop?: boolean;
    /**
     * If true, the tab will not scroll to the top when selected again.
     * @default false
     *
     * @platform iOS
     */
    disableScrollToTop?: boolean;
    /**
     * The children of the trigger.
     *
     * Use `Icon`, `Label`, and `Badge` components to customize the tab.
     */
    children?: React.ReactNode;
    role?: BottomTabsSystemItem;
}
export interface NativeTabsScrollEdgeAppearanceProps {
    ios26LabelStyle?: NativeTabsLabelStyle;
    ios26IconColor?: TypeOrRecord<ColorValue, 'standard' | 'disabled'>;
    blurEffect?: NativeTabsBlurEffect;
    backgroundColor?: ColorValue | null;
    ios26BadgeBackgroundColor?: TypeOrRecord<ColorValue, 'standard' | 'disabled'>;
}
export {};
//# sourceMappingURL=types.d.ts.map