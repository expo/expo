import type { StackHeaderInterpolatedStyle, StackHeaderInterpolationProps } from '../types';
/**
 * Standard UIKit style animation for the header where the title fades into the back button label.
 */
export declare function forUIKit({ current, next, direction, layouts, }: StackHeaderInterpolationProps): StackHeaderInterpolatedStyle;
/**
 * Simple fade animation for the header elements.
 */
export declare function forFade({ current, next, }: StackHeaderInterpolationProps): StackHeaderInterpolatedStyle;
/**
 * Simple translate animation to translate the header to left.
 */
export declare function forSlideLeft({ current, next, direction, layouts: { screen }, }: StackHeaderInterpolationProps): StackHeaderInterpolatedStyle;
/**
 * Simple translate animation to translate the header to right.
 */
export declare function forSlideRight({ current, next, direction, layouts: { screen }, }: StackHeaderInterpolationProps): StackHeaderInterpolatedStyle;
/**
 * Simple translate animation to translate the header to slide up.
 */
export declare function forSlideUp({ current, next, layouts: { header }, }: StackHeaderInterpolationProps): StackHeaderInterpolatedStyle;
export declare function forNoAnimation(): StackHeaderInterpolatedStyle;
//# sourceMappingURL=HeaderStyleInterpolators.d.ts.map