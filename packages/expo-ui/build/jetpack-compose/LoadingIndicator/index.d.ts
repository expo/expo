import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Common props shared by loading indicator variants.
 */
export type LoadingIndicatorCommonConfig = {
    /**
     * The current progress value between `0` and `1`. Omit for indeterminate.
     */
    progress?: number | null;
    /**
     * Loading indicator color.
     */
    color?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A loading indicator that displays loading using morphing shapes.
 *
 * Matches the Jetpack Compose `LoadingIndicator`.
 */
export declare const LoadingIndicator: import("react").ComponentType<LoadingIndicatorCommonConfig>;
export type ContainedLoadingIndicatorProps = LoadingIndicatorCommonConfig & {
    /**
     * Loading indicator's container color
     */
    containerColor?: ColorValue;
};
/**
 * A loading indicator that displays loading using morphing shapes inside a container.
 *
 * Matches the Jetpack Compose `ContainedLoadingIndicator`.
 */
export declare const ContainedLoadingIndicator: import("react").ComponentType<ContainedLoadingIndicatorProps>;
//# sourceMappingURL=index.d.ts.map