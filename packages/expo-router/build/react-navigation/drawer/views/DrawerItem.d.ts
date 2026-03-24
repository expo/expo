import * as React from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { type Route } from '../../native';
type Props = {
    /**
     * The route object which should be specified by the drawer item.
     */
    route?: Route<string>;
    /**
     * The `href` to use for the anchor tag on web
     */
    href?: string;
    /**
     * The label text of the item.
     */
    label: string | ((props: {
        focused: boolean;
        color: string;
    }) => React.ReactNode);
    /**
     * Icon to display for the `DrawerItem`.
     */
    icon?: (props: {
        focused: boolean;
        size: number;
        color: string;
    }) => React.ReactNode;
    /**
     * Whether to highlight the drawer item as active.
     */
    focused?: boolean;
    /**
     * Function to execute on press.
     */
    onPress: () => void;
    /**
     * Color for the icon and label when the item is active.
     */
    activeTintColor?: string;
    /**
     * Color for the icon and label when the item is inactive.
     */
    inactiveTintColor?: string;
    /**
     * Background color for item when its active.
     */
    activeBackgroundColor?: string;
    /**
     * Background color for item when its inactive.
     */
    inactiveBackgroundColor?: string;
    /**
     * Color of the touchable effect on press.
     * Only supported on Android.
     *
     * @platform android
     */
    pressColor?: string;
    /**
     * Opacity of the touchable effect on press.
     * Only supported on iOS.
     *
     * @platform ios
     */
    pressOpacity?: number;
    /**
     * Style object for the label element.
     */
    labelStyle?: StyleProp<TextStyle>;
    /**
     * Style object for the wrapper element.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Whether label font should scale to respect Text Size accessibility settings.
     */
    allowFontScaling?: boolean;
    /**
     * Accessibility label for drawer item.
     */
    accessibilityLabel?: string;
    /**
     * ID to locate this drawer item in tests.
     */
    testID?: string;
};
/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export declare function DrawerItem(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=DrawerItem.d.ts.map