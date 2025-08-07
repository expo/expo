import { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import React from 'react';
import { type ColorValue, type ImageSourcePropType, type TextStyle } from 'react-native';
import { type BottomTabsProps, type BottomTabsScreenProps, type TabBarItemLabelVisibilityMode } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
type BaseNativeTabOptions = Omit<BottomTabsScreenProps, 'children' | 'placeholder' | 'onWillAppear' | 'onDidAppear' | 'onWillDisappear' | 'onDidDisappear' | 'isFocused' | 'tabKey' | 'icon' | 'selectedIcon' | 'iconResourceName'> & DefaultRouterOptions;
type SfSymbolOrImageSource = {
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
export interface NativeTabOptions extends BaseNativeTabOptions {
    /**
     * If true, the tab will be hidden from the tab bar.
     */
    hidden?: boolean;
    /**
     * The icon to display in the tab bar.
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
     */
    selectedIcon?: SfSymbolOrImageSource;
}
export interface NativeTabsViewProps {
    style?: {
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: TextStyle['fontWeight'];
        fontStyle?: TextStyle['fontStyle'];
        color?: TextStyle['color'];
        iconColor?: ColorValue;
        backgroundColor?: ColorValue;
        blurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
        tintColor?: ColorValue;
        badgeBackgroundColor?: ColorValue;
        /**
         * @platform android
         */
        rippleColor?: ColorValue;
        /**
         * @platform android
         */
        labelVisibilityMode?: TabBarItemLabelVisibilityMode;
        '&:active'?: {
            /**
             * @platform android
             */
            color?: ColorValue;
            /**
             * @platform android
             */
            fontSize?: TextStyle['fontSize'];
            /**
             * @platform android
             */
            iconColor?: ColorValue;
            /**
             * @platform android
             */
            indicatorColor?: ColorValue;
        };
    };
    /**
     * https://developer.apple.com/documentation/uikit/uitabbarcontroller/tabbarminimizebehavior
     *
     * Supported values:
     * - `none` - The tab bar does not minimize.
     * - `onScrollUp` - The tab bar minimizes when scrolling up, and expands when scrolling back down. Recommended if the scroll view content is aligned to the bottom.
     * - `onScrollDown` - The tab bar minimizes when scrolling down, and expands when scrolling back up.
     * - `automatic` - Resolves to the system default minimize behavior.
     *
     * @default automatic
     *
     * @platform iOS 26
     */
    minimizeBehavior?: BottomTabsProps['tabBarMinimizeBehavior'];
    /**
     * Disables the active indicator for the tab bar.
     *
     * @platform android
     */
    disableIndicator?: boolean;
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabOptions, Record<string, any>>>;
}
export declare function NativeTabsView(props: NativeTabsViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=NativeTabsView.d.ts.map