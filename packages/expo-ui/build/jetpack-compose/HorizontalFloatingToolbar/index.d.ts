import { ExpoModifier } from '../../types';
export type HorizontalFloatingToolbarProps = {
    /**
     * The children of the component.
     */
    children: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type NativeHorizontalFloatingToolbarProps = HorizontalFloatingToolbarProps & {};
/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
export declare function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map