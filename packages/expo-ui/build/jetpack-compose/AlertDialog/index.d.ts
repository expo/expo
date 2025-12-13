import { ExpoModifier } from '../../types';
/**
 * Color configuration for AlertDialog buttons.
 * @platform android
 */
export type AlertDialogButtonColors = {
    /**
     * The background color of the button.
     */
    containerColor?: string;
    /**
     * The text color of the button.
     */
    contentColor?: string;
};
export type AlertDialogProps = {
    /**
     * The title of the alert dialog.
     */
    title?: string;
    /**
     * The text of the alert dialog.
     */
    text?: string;
    /**
     * The text of the confirm button of the alert dialog.
     */
    confirmButtonText?: string;
    /**
     * The text of the dismiss button of the alert dialog.
     */
    dismissButtonText?: string;
    /**
     * Colors for the confirm button.
     * @platform android
     */
    confirmButtonColors?: AlertDialogButtonColors;
    /**
     * Colors for the dismiss button.
     * @platform android
     */
    dismissButtonColors?: AlertDialogButtonColors;
    /**
     * Whether the alert dialog is visible.
     *
     * @default false
     */
    visible?: boolean;
    /**
     * Callback that is called when the user tries to confirm the dialog.
     */
    onConfirmPressed?: () => void;
    /**
     * Callback that is called when the user tries to dismiss the dialog.
     */
    onDismissPressed?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type NativeAlertDialogProps = AlertDialogProps;
/**
 * Renders an `AlertDialog` component.
 */
export declare function AlertDialog(props: AlertDialogProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map