import { ExpoModifier } from '../../types';
export type HorizontalFloatingToolbarProps = {
    /**
     * The variant of the horizontal floating toolbar.
     * @default 'standard'
     */
    variant?: 'standard' | 'vibrant';
    /**
     * The children of the component.
     */
    children: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type FloatingActionButtonProps = {
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
export declare function FloatingActionButton(props: FloatingActionButtonProps): import("react").JSX.Element;
export declare namespace FloatingActionButton {
    var tag: string;
}
/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
declare function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps): import("react").JSX.Element;
declare namespace HorizontalFloatingToolbar {
    var FloatingActionButton: typeof import(".").FloatingActionButton;
}
export { HorizontalFloatingToolbar };
//# sourceMappingURL=index.d.ts.map