import type { ColorValue } from 'react-native';
/**
 * Possible durations for the Snackbar.
 */
export declare enum SnackbarDuration {
    /**
     * Show the Snackbar indefinitely until explicitly dismissed or action is clicked.
     */
    Indefinite = "indefinite",
    /**
     * Show the Snackbar for a long period of time.
     */
    Long = "long",
    /**
     * Show the Snackbar for a short period of time.
     */
    Short = "short"
}
/**
 * Colors for snackbar's core elements.
 */
export type SnackbarColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    actionColor?: ColorValue;
    actionContentColor?: ColorValue;
    dismissActionContentColor?: ColorValue;
};
export type SnackbarProps = {
    /**
     * Optional action label to show as button in the Snackbar.
     */
    actionLabel?: string;
    /**
     * Duration of the Snackbar.
     */
    duration?: SnackbarDuration;
    /**
     * Text to be shown in the Snackbar.
     */
    message?: string;
    /**
     * A boolean to show a dismiss action in the Snackbar.
     */
    withDismissAction?: boolean;
    /**
     * Whether the snackbar is visible.
     */
    visible?: boolean;
    /**
     * Colors for snackbar's core elements.
     */
    colors?: SnackbarColors;
    /**
     * Callback that is called when the user presses the action button.
     */
    onActionPressed?: () => void;
    /**
     * Callback that is called when the snackbar is dismissed (auto-hide or user interaction).
     */
    onDismissed?: () => void;
};
export type NativeSnackbarProps = SnackbarProps;
/**
 * Renders a `Snackbar` component.
 */
export declare function Snackbar(props: SnackbarProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map