import type { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import type { ColorValue, ImageSourcePropType, TextStyle } from 'react-native';
import type { BottomTabsScreenProps } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface NativeTabOptions extends DefaultRouterOptions {
    /**
     * The icon to display in the tab bar.
     * @platform android
     * @platform iOS
     */
    icon?: SymbolOrImageSource;
    /**
     * The icon to display when the tab is selected.
     * @platform iOS
     */
    selectedIcon?: SymbolOrImageSource;
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
     * The style of the tab label when the tab is selected.
     */
    selectedLabelStyle?: NativeTabsLabelStyle;
    /**
     * The style of all the tab labels, when the tab is selected
     */
    labelStyle?: NativeTabsLabelStyle;
    /**
     * System-provided tab bar item with predefined icon and title
     *
     * Uses Apple's built-in tab bar items (e.g., bookmarks, contacts, downloads) with
     * standard iOS styling and localized titles. If you override the `title`,
     * `icon`, or `selectedIcon`, note that this is not officially supported
     * by Apple and may lead to unexpected results.
     *
     * @see {@link https://developer.apple.com/documentation/uikit/uitabbaritem/systemitem|UITabBarItem.SystemItem}
     * @platform ios
     */
    role?: NativeTabsTabBarItemRole;
    /**
     * The color of the icon when the tab is selected.
     */
    selectedIconColor?: ColorValue;
    /**
     * The color of the badge when the tab is selected.
     */
    selectedBadgeBackgroundColor?: ColorValue;
    /**
     * The color of all the badges when the tab is selected.
     */
    badgeBackgroundColor?: ColorValue;
    /**
     * The color of the badge text.
     *
     * @platform android
     * @platform web
     */
    badgeTextColor?: ColorValue;
    /**
     * The color of the background when the tab is selected.
     */
    backgroundColor?: ColorValue;
    /**
     * The blur effect to apply when the tab is selected.
     *
     * @platform iOS
     */
    blurEffect?: NativeTabsBlurEffect;
    /**
     * The color of the shadow when the tab is selected.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarappearance/shadowcolor)
     *
     * @platform iOS
     */
    shadowColor?: ColorValue;
    /**
     * The color of the icon when the tab is selected.
     *
     * On iOS 26+ you can change the icon color in the scroll edge state.
     */
    iconColor?: ColorValue;
    /**
     * When set to `true`, the tab bar will not become transparent when scrolled to the edge.
     *
     * @platform iOS
     */
    disableTransparentOnScrollEdge?: boolean;
    /**
     * The position adjustment for all the labels when the tab is selected.
     *
     * @platform iOS
     */
    titlePositionAdjustment?: {
        horizontal?: number;
        vertical?: number;
    };
    /**
     * The position adjustment for the label when the tab is selected.
     *
     * @platform iOS
     */
    selectedTitlePositionAdjustment?: {
        horizontal?: number;
        vertical?: number;
    };
    /**
     * The color of the tab indicator.
     *
     * @platform android
     * @platform web
     */
    indicatorColor?: ColorValue;
}
export type SymbolOrImageSource = {
    /**
     * The name of the SF Symbol to use as an icon.
     * @platform iOS
     */
    sf?: SFSymbol;
    /**
     * The name of the drawable resource to use as an icon.
     * @platform android
     */
    drawable?: string;
} | {
    /**
     * The image source to use as an icon.
     */
    src?: ImageSourcePropType | Promise<ImageSourcePropType | null>;
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
    /**
     * The font family of the tab label.
     */
    fontFamily?: TextStyle['fontFamily'];
    /**
     * The font size of the tab label.
     */
    fontSize?: TextStyle['fontSize'];
    /**
     * The font weight of the tab label.
     */
    fontWeight?: NumericFontWeight | `${NumericFontWeight}`;
    /**
     * The font style of the tab label.
     */
    fontStyle?: TextStyle['fontStyle'];
    /**
     * The color of the tab label.
     */
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
export interface NativeTabsProps extends PropsWithChildren {
    /**
     * The style of the every tab label in the tab bar.
     */
    labelStyle?: NativeTabsLabelStyle | {
        default?: NativeTabsLabelStyle;
        selected?: NativeTabsLabelStyle;
    };
    /**
     * The color of every tab icon in the tab bar.
     */
    iconColor?: ColorValue | {
        default?: ColorValue;
        selected?: ColorValue;
    };
    /**
     * The tint color of the tab icon.
     *
     * Can be overridden by icon color and label color for each tab individually.
     */
    tintColor?: ColorValue;
    /**
     * The background color of the tab bar.
     */
    backgroundColor?: ColorValue | null;
    /**
     * The background color of every badge in the tab bar.
     */
    badgeBackgroundColor?: ColorValue;
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
    /**
     * The blur effect applied to the tab bar.
     *
     * @platform iOS
     */
    blurEffect?: NativeTabsBlurEffect;
    /**
     * The color of the shadow.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarappearance/shadowcolor)
     *
     * @platform iOS
     */
    shadowColor?: ColorValue;
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
     * When set to `true`, the tab bar will not become transparent when scrolled to the edge.
     *
     * @platform iOS
     */
    disableTransparentOnScrollEdge?: boolean;
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
    /**
     * The visibility mode of the tab item label.
     *
     * @see [Material Components documentation](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md#making-navigation-bar-accessible)
     *
     * @platform android
     */
    labelVisibilityMode?: NativeTabsTabBarItemLabelVisibilityMode;
    /**
     * The color of the ripple effect when the tab is pressed.
     *
     * @platform android
     */
    rippleColor?: ColorValue;
    /**
     * The color of the tab indicator.
     *
     * @platform android
     * @platform web
     */
    indicatorColor?: ColorValue;
    /**
     * The color of the badge text.
     *
     * @platform android
     * @platform web
     */
    badgeTextColor?: ColorValue;
}
export interface NativeTabsViewProps extends NativeTabsProps {
    focusedIndex: number;
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
    /**
     * System-provided tab bar item with predefined icon and title
     *
     * Uses Apple's built-in tab bar items (e.g., bookmarks, contacts, downloads) with
     * standard iOS styling and localized titles. Custom `icon` or `selectedIcon`
     * properties will override the system icon, but the system-defined title cannot
     * be customized.
     *
     * @see {@link https://developer.apple.com/documentation/uikit/uitabbaritem/systemitem|UITabBarItem.SystemItem}
     * @platform ios
     */
    role?: NativeTabsTabBarItemRole;
}
declare const SUPPORTED_TAB_BAR_ITEM_ROLES: readonly ["bookmarks", "contacts", "downloads", "favorites", "featured", "history", "more", "mostRecent", "mostViewed", "recents", "search", "topRated"];
export type NativeTabsTabBarItemRole = (typeof SUPPORTED_TAB_BAR_ITEM_ROLES)[number];
export interface NativeTabsTriggerTabBarProps {
    /**
     * The style of the every tab label in the tab bar.
     *
     * @platform iOS
     * @platform web
     */
    labelStyle?: NativeTabsLabelStyle;
    /**
     * The background color of the tab bar, when the tab is selected
     */
    backgroundColor?: ColorValue;
    /**
     * The color of every tab icon, when the tab is selected
     *
     * @platform iOS
     */
    iconColor?: ColorValue;
    /**
     * The background color of every badge in the tab bar.
     *
     * @platform iOS
     * @platform web
     */
    badgeBackgroundColor?: ColorValue;
    /**
     * The blur effect applied to the tab bar, when the tab is selected
     *
     * @platform iOS
     */
    blurEffect?: NativeTabsBlurEffect;
    /**
     * The color of the shadow when the tab is selected.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarappearance/shadowcolor)
     *
     * @platform iOS
     */
    shadowColor?: ColorValue;
    /**
     * When set to `true`, the tab bar will not become transparent when scrolled to the edge.
     *
     * @platform iOS
     */
    disableTransparentOnScrollEdge?: boolean;
    /**
     * The color of the badge text.
     *
     * @platform web
     */
    badgeTextColor?: ColorValue;
    /**
     * The color of the tab indicator.
     *
     * @platform web
     */
    indicatorColor?: ColorValue;
}
export {};
//# sourceMappingURL=types.d.ts.map