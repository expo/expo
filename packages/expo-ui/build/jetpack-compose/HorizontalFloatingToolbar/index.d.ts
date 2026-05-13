import type { ColorValue } from 'react-native';
import type { ExpoModifier } from '../../types';
export type HorizontalFloatingToolbarColors = {
    /**
     * Color of the toolbar container (background).
     */
    toolbarContainerColor?: ColorValue;
    /**
     *  Color of the toolbar content (icons/text).
     */
    toolbarContentColor?: ColorValue;
    /**
     * Color of the floating action button container (background).
     */
    fabContainerColor?: ColorValue;
    /**
     *  Color of the floating action button content (icon).
     */
    fabContentColor?: ColorValue;
};
export type HorizontalFloatingToolbarProps = {
    /**
     * The variant of the horizontal floating toolbar.
     * @default 'standard'
     */
    variant?: 'standard' | 'vibrant';
    /**
     * Per-slot color overrides. Any field set here replaces the corresponding
     * color from the variant default; unset fields fall back to the variant.
     */
    colors?: HorizontalFloatingToolbarColors;
    /**
     * The children of the component.
     */
    children: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type HorizontalFloatingToolbarFloatingActionButtonProps = {
    /**
     * A callback that is called when the button is pressed.
     */
    onPress?: () => void;
    /**
     * The children of the component.
     */
    children: React.ReactNode;
};
/**
 * FloatingActionButton component for HorizontalFloatingToolbar.
 * This component marks its children to be rendered in the FAB slot.
 */
export declare function HorizontalFloatingToolbarFloatingActionButton(props: HorizontalFloatingToolbarFloatingActionButtonProps): import("react/jsx-runtime").JSX.Element;
/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
declare function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps): import("react/jsx-runtime").JSX.Element;
declare namespace HorizontalFloatingToolbar {
    var FloatingActionButton: typeof HorizontalFloatingToolbarFloatingActionButton;
}
export { HorizontalFloatingToolbar };
//# sourceMappingURL=index.d.ts.map