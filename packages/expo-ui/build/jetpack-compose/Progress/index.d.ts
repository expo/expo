import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Stroke cap style for progress indicators.
 */
export type StrokeCap = 'round' | 'butt' | 'square';
export type LinearProgressIndicatorProps = {
    /**
     * The current progress value between `0` and `1`. Omit for indeterminate.
     */
    progress?: number | null;
    /**
     * Progress indicator color.
     */
    color?: ColorValue;
    /**
     * Track (background) color.
     */
    trackColor?: ColorValue;
    /**
     * Stroke cap style for the indicator ends.
     * @default 'round'
     */
    strokeCap?: StrokeCap;
    /**
     * Gap size between the indicator and track in dp.
     */
    gapSize?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A linear progress indicator that displays progress in a horizontal bar.
 *
 * Matches the Jetpack Compose `LinearProgressIndicator`.
 */
export declare const LinearProgressIndicator: import("react").ComponentType<LinearProgressIndicatorProps>;
export type CircularProgressIndicatorProps = {
    /**
     * The current progress value between `0` and `1`. Omit for indeterminate.
     */
    progress?: number | null;
    /**
     * Progress indicator color.
     */
    color?: ColorValue;
    /**
     * Track (background) color.
     */
    trackColor?: ColorValue;
    /**
     * Width of the circular stroke in dp.
     */
    strokeWidth?: number;
    /**
     * Stroke cap style for the indicator ends.
     * @default 'round'
     */
    strokeCap?: StrokeCap;
    /**
     * Gap size between the indicator and track in dp.
     */
    gapSize?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A circular progress indicator that displays progress in a circular format.
 *
 * Matches the Jetpack Compose `CircularProgressIndicator`.
 */
export declare const CircularProgressIndicator: import("react").ComponentType<CircularProgressIndicatorProps>;
export type LinearWavyProgressIndicatorProps = {
    /**
     * The current progress value between `0` and `1`. Omit for indeterminate.
     */
    progress?: number | null;
    /**
     * Progress indicator color.
     */
    color?: ColorValue;
    /**
     * Track (background) color.
     */
    trackColor?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A linear progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `LinearWavyProgressIndicator`.
 */
export declare const LinearWavyProgressIndicator: import("react").ComponentType<LinearWavyProgressIndicatorProps>;
export type CircularWavyProgressIndicatorProps = {
    /**
     * The current progress value between `0` and `1`. Omit for indeterminate.
     */
    progress?: number | null;
    /**
     * Progress indicator color.
     */
    color?: ColorValue;
    /**
     * Track (background) color.
     */
    trackColor?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A circular progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `CircularWavyProgressIndicator`.
 */
export declare const CircularWavyProgressIndicator: import("react").ComponentType<CircularWavyProgressIndicatorProps>;
//# sourceMappingURL=index.d.ts.map