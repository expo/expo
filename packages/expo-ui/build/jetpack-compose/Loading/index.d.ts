import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier } from '../../types';
export type LoadingVariant = 'default' | 'contained';
export type LoadingProps = {
    /**
     * The variant of the loading indicator.
     * - `default`: A standard loading indicator with morphing shapes.
     * - `contained`: A loading indicator inside a circular colored background.
     *
     * @default 'default'
     * @platform android
     */
    variant?: LoadingVariant;
    /**
     * The progress value of the indicator.
     * - If provided: Determinate mode - morphs shapes based on progress value.
     * - If null/undefined: Indeterminate mode - continuous morphing animation.
     *
     * This is a number between `0` and `1`.
     */
    progress?: number | null;
    /**
     * The color of the loading indicator shapes.
     *
     * - Default variant: Color of the morphing shapes
     * - Contained variant: Color of the indicator (defaults to white)
     *
     */
    color?: ColorValue;
    /**
     * The color of the circular background container.
     * Only applies when `variant` is `contained`.
     *
     */
    containerColor?: ColorValue;
    /**
     * Custom styles for the component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a `Loading` component.
 */
export declare function Loading(props: LoadingProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map