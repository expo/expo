import type { DefaultRouterOptions } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { TabsScreenProps } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
export type NativeScreenProps = Partial<Omit<TabsScreenProps, 'tabKey' | 'isFocused'>>;
export interface NativeTabOptions extends DefaultRouterOptions {
    icon?: SymbolOrImageSource;
    selectedIcon?: SymbolOrImageSource;
    title?: string;
    badgeValue?: string;
    selectedLabelStyle?: NativeTabsLabelStyle;
    labelStyle?: NativeTabsLabelStyle;
    role?: NativeTabsTabBarItemRole;
    selectedIconColor?: ColorValue;
    selectedBadgeBackgroundColor?: ColorValue;
    badgeBackgroundColor?: ColorValue;
    badgeTextColor?: ColorValue;
    backgroundColor?: ColorValue;
    blurEffect?: NativeTabsBlurEffect;
    shadowColor?: ColorValue;
    iconColor?: ColorValue;
    disableTransparentOnScrollEdge?: boolean;
    titlePositionAdjustment?: {
        horizontal?: number;
        vertical?: number;
    };
    selectedTitlePositionAdjustment?: {
        horizontal?: number;
        vertical?: number;
    };
    indicatorColor?: ColorValue;
    hidden?: boolean;
    specialEffects?: TabsScreenProps['specialEffects'];
    nativeProps?: NativeScreenProps;
    disableAutomaticContentInsets?: boolean;
    contentStyle?: Pick<ViewStyle, 'backgroundColor' | 'experimental_backgroundImage' | 'padding' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'paddingBlock' | 'paddingBlockEnd' | 'paddingBlockStart' | 'paddingInline' | 'paddingInlineEnd' | 'paddingInlineStart' | 'paddingEnd' | 'paddingHorizontal' | 'paddingVertical' | 'paddingStart' | 'alignContent' | 'alignItems' | 'justifyContent' | 'flexDirection' | 'gap'>;
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
    /**
     * Controls how the icon is rendered on iOS.
     * @platform ios
     * @default 'template'
     */
    renderingMode?: 'template' | 'original';
};
export type NativeTabsLabelStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontStyle' | 'fontWeight' | 'color'>;
export declare const SUPPORTED_BLUR_EFFECTS: readonly ["none", "systemDefault", "extraLight", "light", "dark", "regular", "prominent", "systemUltraThinMaterial", "systemThinMaterial", "systemMaterial", "systemThickMaterial", "systemChromeMaterial", "systemUltraThinMaterialLight", "systemThinMaterialLight", "systemMaterialLight", "systemThickMaterialLight", "systemChromeMaterialLight", "systemUltraThinMaterialDark", "systemThinMaterialDark", "systemMaterialDark", "systemThickMaterialDark", "systemChromeMaterialDark"];
/**
 * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiblureffect/style)
 */
export type NativeTabsBlurEffect = (typeof SUPPORTED_BLUR_EFFECTS)[number];
export interface NativeTabsProps extends PropsWithChildren {
    /**
     * The style of the every tab label in the tab bar.
     */
    labelStyle?: StyleProp<NativeTabsLabelStyle> | {
        default?: StyleProp<NativeTabsLabelStyle>;
        selected?: StyleProp<NativeTabsLabelStyle>;
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
    backgroundColor?: ColorValue;
    /**
     * The background color of every badge in the tab bar.
     */
    badgeBackgroundColor?: ColorValue;
    /**
     * When set to `true`, hides the tab bar.
     *
     * @default false
     */
    hidden?: boolean;
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
     * @see The supported values correspond to the official [Apple documentation](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior).
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
     * When set to `true`, enables the sidebarAdaptable tab bar style on iPadOS and macOS. This prop has no effect on iPhone.
     *
     * @platform iOS 18+
     */
    sidebarAdaptable?: boolean;
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
export interface InternalNativeTabsProps extends NativeTabsProps {
    nonTriggerChildren?: React.ReactNode;
}
export interface NativeTabsViewProps extends Omit<InternalNativeTabsProps, 'labelStyle' | 'iconColor' | 'backgroundColor' | 'badgeBackgroundColor' | 'blurEffect' | 'indicatorColor' | 'badgeTextColor'> {
    focusedIndex: number;
    tabs: NativeTabsViewTabItem[];
    onTabChange: (tabKey: string) => void;
}
export interface NativeTabsViewTabItem {
    options: NativeTabOptions;
    routeKey: string;
    name: string;
    contentRenderer: () => React.ReactNode;
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
     *
     * > **Note**: Marking a tab as `hidden` means it cannot be navigated to in any way.
     *
     * > **Note**: Dynamically hiding tabs will remount the navigator and the state will be reset.
     */
    hidden?: boolean;
    /**
     * Props passed to the underlying native tab screen implementation.
     * Use this to configure props not directly exposed by Expo Router, but available in `react-native-screens`.
     *
     * > **Note**: This will override any other props set by Expo Router and may lead to unexpected behavior.
     *
     * > **Note**: This is an unstable API and may change or be removed in minor versions.
     *
     * @platform android
     * @platform iOS
     */
    unstable_nativeProps?: NativeScreenProps;
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
     * @see The supported values correspond to the official [Apple documentation](https://developer.apple.com/documentation/uikit/uitabbaritem/systemitem).
     * @platform ios
     */
    role?: NativeTabsTabBarItemRole;
    /**
     * The default behavior differs between iOS and Android.
     *
     * On **Android**, the content of a native tabs screen is automatically wrapped in a `SafeAreaView`,
     * and the **bottom** inset is applied. Other insets must be handled manually.
     *
     * On **iOS**, the first scroll view nested inside a native tabs screen has
     * [automatic content inset adjustment](https://reactnative.dev/docs/scrollview#contentinsetadjustmentbehavior-ios) enabled
     *
     * When this property is set to `true`, automatic content inset adjustment is disabled for the screen
     * and must be managed manually. You can use `SafeAreaView` from `react-native-screens/experimental`
     * to handle safe area insets.
     *
     * @platform android
     * @platform ios
     */
    disableAutomaticContentInsets?: boolean;
    /**
     * The style applied to the content of the tab
     *
     * Note: Only certain style properties are supported.
     */
    contentStyle?: NativeTabOptions['contentStyle'];
}
declare const SUPPORTED_TAB_BAR_ITEM_ROLES: readonly ["bookmarks", "contacts", "downloads", "favorites", "featured", "history", "more", "mostRecent", "mostViewed", "recents", "search", "topRated"];
export type NativeTabsTabBarItemRole = (typeof SUPPORTED_TAB_BAR_ITEM_ROLES)[number];
export {};
//# sourceMappingURL=types.d.ts.map