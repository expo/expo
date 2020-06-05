import * as React from 'react';
import { View } from 'react-native';
import { NativeLinearGradientPoint } from './NativeLinearGradient.types';
export declare type LinearGradientPoint = {
    x: number;
    y: number;
} | NativeLinearGradientPoint;
export declare type LinearGradientProps = {
    /**
     * An array of colors that represent stops in the gradient.
     * At least two colors are required.
     */
    colors: string[];
    /**
     * An array of `number`s ranging from 0 to 1, the same length as the `colors` property. Each item
     * represents where the corresponding color should be located.
     *
     * For example, `[0.5, 1.0]` would make the first color start 50% through the gradient view (the middle), and the second color 100% through the gradient (the end).
     *
     * Items must be in numeric order.
     */
    locations?: number[] | null;
    /**
     * An object `{ x: number; y: number }` or array `[x, y]` which represents the position
     * that the gradient starts at, as a fraction of the overall size of the gradient ranging from 0 to 1.
     *
     * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will start `10%` from the left and `20%` from the top.
     *
     * On web, this changes the angle of the gradient because CSS gradients don't support changing the starting position.
     */
    start?: LinearGradientPoint | null;
    /**
     * An object `{ x: number; y: number }` or array `[x, y]` which represents the position
     * that the gradient ends at, as a fraction of the overall size of the gradient ranging from 0 to 1.
     *
     * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will end `10%` from the left and `20%` from the bottom.
     *
     * On web, this changes the angle of the gradient because CSS gradients don't support changing the end position.
     */
    end?: LinearGradientPoint | null;
} & React.ComponentProps<typeof View>;
/**
 * Renders a native view that transitions between multiple colors in a linear direction.
 */
export declare const LinearGradient: React.FC<LinearGradientProps>;
