import type { ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Color overrides for the `DropdownMenuItem` component.
 */
export type DropdownMenuItemElementColors = {
    /** Color of the menu item text. */
    textColor?: ColorValue;
    /** Color of the text when the menu item is disabled. */
    disabledTextColor?: ColorValue;
};
/**
 * Props of the `DropdownMenuItem` component.
 */
export type DropdownMenuItemProps = {
    /**
     * Whether the menu item is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Color overrides for the menu item.
     */
    elementColors?: DropdownMenuItemElementColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Callback that is called when the menu item is clicked.
     */
    onClick?: () => void;
    /**
     * Slot children for text, leading/trailing icons.
     */
    children?: React.ReactNode;
};
/**
 * A text slot for `DropdownMenuItem`.
 * Wrap text content to display as the menu item label.
 *
 * @platform android
 */
declare function TextSlot(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * A dropdown menu item component that wraps Compose's `DropdownMenuItem`.
 * Should be used inside `DropdownMenu.Items` or `ExposedDropdownMenu`.
 *
 * @platform android
 */
declare function DropdownMenuItemComponent(props: DropdownMenuItemProps): import("react/jsx-runtime").JSX.Element;
declare namespace DropdownMenuItemComponent {
    var Text: typeof TextSlot;
    var LeadingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var TrailingIcon: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { DropdownMenuItemComponent as DropdownMenuItem };
//# sourceMappingURL=DropdownMenuItem.d.ts.map