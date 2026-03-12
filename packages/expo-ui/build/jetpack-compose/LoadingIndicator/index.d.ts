import { ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
export type LoadingIndicatorVariant = 'default' | 'contained';
export type LoadingIndicatorProps = {
    /**
     * The variant of the loading indicator.
     * - `default`: A standard loading indicator with morphing shapes.
     * - `contained`: A loading indicator inside a circular colored background.
     *
     * @default 'default'
     * @platform android
     */
    variant?: LoadingIndicatorVariant;
    /**
     * The progress value of the indicator.
     * - If provided: Determinate mode, which morphs shapes according to the progress value.
     * - If `null` or `undefined`: Indeterminate mode, which uses continuous morphing animation.
     *
     * This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * The color of the loading indicator shapes.
     *
     * - Default variant: Color of the morphing shapes
     * - Contained variant: Color of the indicator (defaults to white)
     */
    color?: ColorValue;
    /**
     * The color of the circular background container.
     * Only applies when `variant` is `contained`.
     */
    containerColor?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a `LoadingIndicator` component.
 */
export declare function LoadingIndicator(props: LoadingIndicatorProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map