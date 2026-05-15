import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Props of the `DropdownMenu` component.
 */
export type DropdownMenuProps = {
    /**
     * The contents of the submenu are used as an anchor for the dropdown menu.
     * The children will be wrapped in a pressable element, which triggers opening of the dropdown menu.
     */
    children: ReactNode;
    /**
     * Whether the dropdown menu is expanded (visible).
     */
    expanded?: boolean;
    /**
     * Callback fired when the menu requests to be dismissed (e.g. tapping outside).
     * Must be provided when `expanded` is `true` to allow the menu to close.
     */
    onDismissRequest?: () => void;
    /**
     * The color of the container holding the dropdown menu items.
     */
    color?: ColorValue;
    /**
     * Optional styles to apply to the `DropdownMenu`.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * Container for items displayed in the dropdown menu.
 * Children should be `DropdownMenuItem` components or other native views.
 */
export declare function Items(props: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare namespace Items {
    var tag: string;
}
/**
 * Container for the trigger element that opens the dropdown menu.
 */
export declare function Trigger(props: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare namespace Trigger {
    var tag: string;
}
/**
 * Preview content shown during long press (iOS only).
 */
export declare function Preview(props: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
declare function DropdownMenu(props: DropdownMenuProps): import("react/jsx-runtime").JSX.Element;
declare namespace DropdownMenu {
    var Trigger: typeof import(".").Trigger;
    var Preview: typeof import(".").Preview;
    var Items: typeof import(".").Items;
}
export { DropdownMenu };
export { DropdownMenuItem } from './DropdownMenuItem';
//# sourceMappingURL=index.d.ts.map