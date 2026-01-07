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
type FloatingActionButtonProps = {
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
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
declare function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps): import("react").JSX.Element;
declare namespace HorizontalFloatingToolbar {
    var FloatingActionButton: (props: FloatingActionButtonProps) => import("react").JSX.Element;
}
export { HorizontalFloatingToolbar };
//# sourceMappingURL=index.d.ts.map