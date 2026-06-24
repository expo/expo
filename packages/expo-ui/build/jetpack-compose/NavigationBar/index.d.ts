import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
type SlotProps = {
    children: React.ReactNode;
};
/**
 * Colors for navigation bar items in different states.
 */
export type NavigationBarItemColors = {
    selectedIconColor?: ColorValue;
    selectedTextColor?: ColorValue;
    selectedIndicatorColor?: ColorValue;
    unselectedIconColor?: ColorValue;
    unselectedTextColor?: ColorValue;
    disabledIconColor?: ColorValue;
    disabledTextColor?: ColorValue;
};
export interface NavigationBarProps {
    /**
     * Background color of the navigation bar.
     * @default NavigationBarDefaults.containerColor
     */
    containerColor?: ColorValue;
    /**
     * Preferred content color inside the navigation bar.
     * @default contentColorFor(containerColor)
     */
    contentColor?: ColorValue;
    /**
     * Tonal elevation in dp.
     * @default NavigationBarDefaults.Elevation
     */
    tonalElevation?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Navigation bar items.
     */
    children?: React.ReactNode;
}
export interface NavigationBarItemProps {
    /**
     * Whether this item is currently selected.
     */
    selected: boolean;
    /**
     * Callback that is called when the item is clicked.
     */
    onClick?: () => void;
    /**
     * Whether the item is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Whether to always show the label.
     * @default true
     */
    alwaysShowLabel?: boolean;
    /**
     * Colors for the item in different states.
     */
    colors?: NavigationBarItemColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing `Icon`, `SelectedIcon`, and `Label` slots.
     */
    children?: React.ReactNode;
}
/**
 * Icon slot for `NavigationBarItem`.
 */
declare function NavigationBarItemIcon(props: SlotProps): import("react/jsx-runtime").JSX.Element;
/**
 * Selected icon slot for `NavigationBarItem`. Falls back to `Icon` when omitted.
 */
declare function NavigationBarItemSelectedIcon(props: SlotProps): import("react/jsx-runtime").JSX.Element;
/**
 * Label slot for `NavigationBarItem`.
 */
declare function NavigationBarItemLabel(props: SlotProps): import("react/jsx-runtime").JSX.Element;
/**
 * A Material Design 3 navigation bar.
 */
export declare function NavigationBar(props: NavigationBarProps): import("react/jsx-runtime").JSX.Element;
/**
 * A Material Design 3 navigation bar item. Must be used inside `NavigationBar`.
 */
declare function NavigationBarItemComponent(props: NavigationBarItemProps): import("react/jsx-runtime").JSX.Element;
declare namespace NavigationBarItemComponent {
    var Icon: typeof NavigationBarItemIcon;
    var SelectedIcon: typeof NavigationBarItemSelectedIcon;
    var Label: typeof NavigationBarItemLabel;
}
export { NavigationBarItemComponent as NavigationBarItem };
//# sourceMappingURL=index.d.ts.map