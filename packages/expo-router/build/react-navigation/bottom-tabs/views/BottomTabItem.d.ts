import React from 'react';
import { type ColorValue, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { type Route } from '../../native';
import type { BottomTabBarButtonProps, BottomTabDescriptor, LabelPosition } from '../types';
type Props = {
    /**
     * The route object which should be specified by the tab.
     */
    route: Route<string>;
    /**
     * The `href` to use for the anchor tag on web
     */
    href?: string;
    /**
     * Whether the tab is focused.
     */
    focused: boolean;
    /**
     * The descriptor object for the route.
     */
    descriptor: BottomTabDescriptor;
    /**
     * The label text of the tab.
     */
    label: string | ((props: {
        focused: boolean;
        color: ColorValue;
        position: LabelPosition;
        children: string;
    }) => React.ReactNode);
    /**
     * Icon to display for the tab.
     */
    icon: (props: {
        focused: boolean;
        size: number;
        color: ColorValue;
    }) => React.ReactNode;
    /**
     * Text to show in a badge on the tab icon.
     */
    badge?: number | string;
    /**
     * Custom style for the badge.
     */
    badgeStyle?: StyleProp<TextStyle>;
    /**
     * The button for the tab. Uses a `Pressable` by default.
     */
    button?: (props: BottomTabBarButtonProps) => React.ReactNode;
    /**
     * The accessibility label for the tab.
     */
    accessibilityLabel?: string;
    /**
     * An unique ID for testing for the tab.
     */
    testID?: string;
    /**
     * Function to execute on press in React Native.
     * On the web, this will use onClick.
     */
    onPress: (e: React.MouseEvent<HTMLElement, MouseEvent> | GestureResponderEvent) => void;
    /**
     * Function to execute on long press.
     */
    onLongPress: (e: GestureResponderEvent) => void;
    /**
     * Whether the label should be aligned with the icon horizontally.
     */
    horizontal: boolean;
    /**
     * Whether to render the icon and label in compact mode.
     */
    compact: boolean;
    /**
     * Whether the tab is an item in a side bar.
     */
    sidebar: boolean;
    /**
     * Variant of navigation bar styling
     * - `uikit`: iOS UIKit style
     * - `material`: Material Design style
     */
    variant: 'uikit' | 'material';
    /**
     * Color for the icon and label when the item is active.
     */
    activeTintColor?: ColorValue;
    /**
     * Color for the icon and label when the item is inactive.
     */
    inactiveTintColor?: ColorValue;
    /**
     * Background color for item when its active.
     */
    activeBackgroundColor?: ColorValue;
    /**
     * Background color for item when its inactive.
     */
    inactiveBackgroundColor?: ColorValue;
    /**
     * Whether to show the label text for the tab.
     */
    showLabel?: boolean;
    /**
     * Whether to allow scaling the font for the label for accessibility purposes.
     * Defaults to `false` on iOS 13+ where it uses `largeContentTitle`.
     */
    allowFontScaling?: boolean;
    /**
     * Style object for the label element.
     */
    labelStyle?: StyleProp<TextStyle>;
    /**
     * Style object for the icon element.
     */
    iconStyle?: StyleProp<ViewStyle>;
    /**
     * Style object for the wrapper element.
     */
    style?: StyleProp<ViewStyle>;
};
export declare function BottomTabItem({ route, href, focused, descriptor, label, icon, badge, badgeStyle, button, accessibilityLabel, testID, onPress, onLongPress, horizontal, compact, sidebar, variant, activeTintColor: customActiveTintColor, inactiveTintColor: customInactiveTintColor, activeBackgroundColor: customActiveBackgroundColor, inactiveBackgroundColor, showLabel, allowFontScaling, labelStyle, iconStyle, style, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BottomTabItem.d.ts.map