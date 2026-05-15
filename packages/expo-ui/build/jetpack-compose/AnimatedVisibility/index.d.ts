import { type PrimitiveBaseProps } from '../layout-types';
import { ENTER_TRANSITION_SYMBOL, EXIT_TRANSITION_SYMBOL } from './symbols';
type EnterTransitionRecord = {
    type: 'fadeIn' | 'slideInHorizontally' | 'slideInVertically' | 'expandIn' | 'expandHorizontally' | 'expandVertically' | 'scaleIn';
    initialAlpha?: number;
    /** Fraction of width: -1.0 = full width left, 1.0 = full width right */
    initialOffsetX?: number;
    /** Fraction of height: -1.0 = full height top, 1.0 = full height bottom */
    initialOffsetY?: number;
    initialScale?: number;
};
type ExitTransitionRecord = {
    type: 'fadeOut' | 'slideOutHorizontally' | 'slideOutVertically' | 'shrinkOut' | 'shrinkHorizontally' | 'shrinkVertically' | 'scaleOut';
    targetAlpha?: number;
    /** Fraction of width: -1.0 = full width left, 1.0 = full width right */
    targetOffsetX?: number;
    /** Fraction of height: -1.0 = full height top, 1.0 = full height bottom */
    targetOffsetY?: number;
    targetScale?: number;
};
/**
 * Represents an enter transition that can be combined with other enter transitions using `.plus()`.
 */
export type EnterTransitionType = {
    /** Combines this transition with another enter transition (mirrors Compose's `+` operator). */
    plus: (other: EnterTransitionType) => EnterTransitionType;
    [ENTER_TRANSITION_SYMBOL]: () => EnterTransitionRecord[];
};
/**
 * Represents an exit transition that can be combined with other exit transitions using `.plus()`.
 */
export type ExitTransitionType = {
    /** Combines this transition with another exit transition (mirrors Compose's `+` operator). */
    plus: (other: ExitTransitionType) => ExitTransitionType;
    [EXIT_TRANSITION_SYMBOL]: () => ExitTransitionRecord[];
};
/**
 * Factory for enter transitions used with `AnimatedVisibility`.
 * Transitions can be combined using `.plus()`.
 *
 * @example
 * ```tsx
 * // Single transition
 * EnterTransition.fadeIn()
 *
 * // Combined transitions
 * EnterTransition.fadeIn({ initialAlpha: 0.3 })
 *   .plus(EnterTransition.slideInHorizontally({ initialOffsetX: 1.0 }))
 * ```
 */
export declare const EnterTransition: {
    /** Fades the content in. */
    fadeIn: (params?: {
        initialAlpha?: number;
    }) => EnterTransitionType;
    /** Slides the content in horizontally. */
    slideInHorizontally: (params?: {
        initialOffsetX?: number;
    }) => EnterTransitionType;
    /** Slides the content in vertically. */
    slideInVertically: (params?: {
        initialOffsetY?: number;
    }) => EnterTransitionType;
    /** Expands the content from the center. */
    expandIn: () => EnterTransitionType;
    /** Expands the content horizontally from the center. */
    expandHorizontally: () => EnterTransitionType;
    /** Expands the content vertically from the center. */
    expandVertically: () => EnterTransitionType;
    /** Scales the content in from a smaller size. */
    scaleIn: (params?: {
        initialScale?: number;
    }) => EnterTransitionType;
};
/**
 * Factory for exit transitions used with `AnimatedVisibility`.
 * Transitions can be combined using `.plus()`.
 *
 * @example
 * ```tsx
 * // Single transition
 * ExitTransition.fadeOut()
 *
 * // Combined transitions
 * ExitTransition.fadeOut()
 *   .plus(ExitTransition.slideOutHorizontally({ targetOffsetX: 1.0 }))
 * ```
 */
export declare const ExitTransition: {
    /** Fades the content out. */
    fadeOut: (params?: {
        targetAlpha?: number;
    }) => ExitTransitionType;
    /** Slides the content out horizontally. */
    slideOutHorizontally: (params?: {
        targetOffsetX?: number;
    }) => ExitTransitionType;
    /** Slides the content out vertically. */
    slideOutVertically: (params?: {
        targetOffsetY?: number;
    }) => ExitTransitionType;
    /** Shrinks the content towards the center. */
    shrinkOut: () => ExitTransitionType;
    /** Shrinks the content horizontally towards the center. */
    shrinkHorizontally: () => ExitTransitionType;
    /** Shrinks the content vertically towards the center. */
    shrinkVertically: () => ExitTransitionType;
    /** Scales the content out to a smaller size. */
    scaleOut: (params?: {
        targetScale?: number;
    }) => ExitTransitionType;
};
export type AnimatedVisibilityProps = {
    children?: React.ReactNode;
    /**
     * Whether the content is visible. When changed, the content will animate in or out.
     */
    visible: boolean;
    /**
     * The enter transition to use when `visible` changes to `true`.
     * Use `EnterTransition` factory methods and combine with `.plus()`.
     * Defaults to Compose's `fadeIn + expandIn` when not specified.
     */
    enterTransition?: EnterTransitionType;
    /**
     * The exit transition to use when `visible` changes to `false`.
     * Use `ExitTransition` factory methods and combine with `.plus()`.
     * Defaults to Compose's `fadeOut + shrinkOut` when not specified.
     */
    exitTransition?: ExitTransitionType;
} & PrimitiveBaseProps;
export declare function AnimatedVisibility(props: AnimatedVisibilityProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map