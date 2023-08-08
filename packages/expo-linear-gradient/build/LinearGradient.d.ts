import * as React from 'react';
import { ViewProps } from 'react-native';
import { NativeLinearGradientPoint } from './NativeLinearGradient.types';
/**
 * An object `{ x: number; y: number }` or array `[x, y]` that represents the point
 * at which the gradient starts or ends, as a fraction of the overall size of the gradient ranging
 * from `0` to `1`, inclusive.
 */
export type LinearGradientPoint = {
    /**
     * A number ranging from `0` to `1`, representing the position of gradient transformation.
     */
    x: number;
    /**
     * A number ranging from `0` to `1`, representing the position of gradient transformation.
     */
    y: number;
} | NativeLinearGradientPoint;
export type LinearGradientProps = ViewProps & {
    /**
     * An array of colors that represent stops in the gradient. At least two colors are required
     * (for a single-color background, use the `style.backgroundColor` prop on a `View` component).
     */
    colors: string[];
    /**
     * An array that contains `number`s ranging from `0` to `1`, inclusive, and is the same length as the `colors` property.
     * Each number indicates a color-stop location where each respective color should be located.
     * If not specified, the colors will be distributed evenly across the gradient.
     *
     * For example, `[0.5, 0.8]` would render:
     * - the first color, solid, from the beginning of the gradient view to 50% through (the middle);
     * - a gradient from the first color to the second from the 50% point to the 80% point; and
     * - the second color, solid, from the 80% point to the end of the gradient view.
     *
     * > The color-stop locations must be ascending from least to greatest.
     * @default []
     */
    locations?: number[] | null;
    /**
     * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will start `10%` from the left and `20%` from the top.
     *
     * **On web**, this only changes the angle of the gradient because CSS gradients don't support changing the starting position.
     * @default { x: 0.5, y: 0.0 }
     */
    start?: LinearGradientPoint | null;
    /**
     * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will end `10%` from the left and `20%` from the bottom.
     *
     * **On web**, this only changes the angle of the gradient because CSS gradients don't support changing the end position.
     * @default { x: 0.5, y: 1.0 }
     */
    end?: LinearGradientPoint | null;
    /**
     * Specifies the direction of the gradient color transition. Each value represents a particular direction:
     * - `GradientDirection.UP` starts the gradient at the bottom and ends at the top.
     * - `GradientDirection.TOP_RIGHT` starts the gradient at the bottom left and ends at the top right.
     * - `GradientDirection.RIGHT` starts the gradient on the left and ends on the right.
     * - `GradientDirection.BOTTOM_RIGHT` starts the gradient at the top left and ends at the bottom right.
     * - `GradientDirection.DOWN` starts the gradient at the top and ends at the bottom.
     * - `GradientDirection.BOTTOM_LEFT` starts the gradient at the top right and ends at the bottom left.
     * - `GradientDirection.LEFT` starts the gradient on the right and ends on the left.
     * - `GradientDirection.TOP_LEFT` starts the gradient at the bottom right and ends at the top left.
     *
     * Specifying 'start' or 'end' properties will override the 'gradientDirection' property.
     *
     * If not specified, it defaults to the start and end properties
     *
     * Note: For web, the direction will only alter the angle of the gradient, as CSS gradients do not support changing start and end positions.
     */
    gradientDirection?: GradientDirection | undefined;
};
export declare enum GradientDirection {
    UP = "up",
    TOP_RIGHT = "top-right",
    RIGHT = "right",
    BOTTOM_RIGHT = "bottom-right",
    DOWN = "down",
    BOTTOM_LEFT = "bottom-left",
    LEFT = "left",
    TOP_LEFT = "top-left"
}
/**
 * Renders a native view that transitions between multiple colors in a linear direction.
 */
export declare class LinearGradient extends React.Component<LinearGradientProps> {
    render(): JSX.Element;
}
//# sourceMappingURL=LinearGradient.d.ts.map