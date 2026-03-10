import { ReactNode } from 'react';
import { StyleProp, ViewStyle, type ColorValue } from 'react-native';
import { ModifierConfig } from '../../types';
/**
 * Props of the `ContextMenu` component.
 */
export type ContextMenuProps = {
    /**
     * The contents of the submenu are used as an anchor for the context menu.
     * The children will be wrapped in a pressable element, which triggers opening of the context menu.
     */
    children: ReactNode;
    /**
     * Whether the context menu is expanded (visible).
     */
    expanded?: boolean;
    /**
     * Callback fired when the menu requests to be dismissed (e.g. tapping outside).
     * Must be provided when `expanded` is `true` to allow the menu to close.
     */
    onDismissRequest?: () => void;
    /**
     * The color of the container holding the context menu items.
     */
    color?: ColorValue;
    /**
     * Optional styles to apply to the `ContextMenu`.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * Container for items displayed in the context menu dropdown.
 * Children should be `DropdownMenuItem` components or other native views.
 */
export declare function Items(props: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare namespace Items {
    var tag: string;
}
/**
 * Container for the trigger element that opens the context menu.
 */
export declare function Trigger(props: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare namespace Trigger {
    var tag: string;
}
/**
 * Preview content shown during long press (iOS only).
 */
export declare function Preview(props: {
    children: ReactNode;
}): import("react").JSX.Element;
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import(".").Trigger;
    var Preview: typeof import(".").Preview;
    var Items: typeof import(".").Items;
}
export { ContextMenu };
export { DropdownMenuItem } from './DropdownMenuItem';
//# sourceMappingURL=index.d.ts.map