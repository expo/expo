import { type ColorValue } from 'react-native';
import { type ModifierConfig, type DialogProperties } from '../../types';
/**
 * Colors for the alert dialog, matching `AlertDialogDefaults` in Compose.
 */
export type AlertDialogColors = {
    /**
     * The background color of the dialog.
     */
    containerColor?: ColorValue;
    /**
     * The color of the icon.
     */
    iconContentColor?: ColorValue;
    /**
     * The color of the title text.
     */
    titleContentColor?: ColorValue;
    /**
     * The color of the body text.
     */
    textContentColor?: ColorValue;
};
export type AlertDialogProps = {
    /**
     * Colors for the alert dialog.
     */
    colors?: AlertDialogColors;
    /**
     * The tonal elevation of the dialog in dp, which affects its background color
     * based on the color scheme.
     */
    tonalElevation?: number;
    /**
     * Properties for the dialog window.
     */
    properties?: DialogProperties;
    /**
     * Callback that is called when the user tries to dismiss the dialog
     * (for example, by tapping outside of it or pressing the back button).
     */
    onDismissRequest?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing slot sub-components (`AlertDialog.Title`, `AlertDialog.Text`,
     * `AlertDialog.ConfirmButton`, `AlertDialog.DismissButton`, `AlertDialog.Icon`).
     */
    children?: React.ReactNode;
};
/**
 * The title slot of the `AlertDialog`.
 */
declare function AlertDialogTitle(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * The text (body) slot of the `AlertDialog`.
 */
declare function AlertDialogText(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * The confirm button slot of the `AlertDialog`.
 */
declare function AlertDialogConfirmButton(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * The dismiss button slot of the `AlertDialog`.
 */
declare function AlertDialogDismissButton(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * The icon slot of the `AlertDialog`.
 */
declare function AlertDialogIcon(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Renders an `AlertDialog` component with slot-based content matching the Compose API.
 * Content is provided via slot sub-components: `AlertDialog.Title`, `AlertDialog.Text`,
 * `AlertDialog.ConfirmButton`, `AlertDialog.DismissButton`, and `AlertDialog.Icon`.
 */
declare function AlertDialogComponent(props: AlertDialogProps): import("react/jsx-runtime").JSX.Element;
declare namespace AlertDialogComponent {
    var Title: typeof AlertDialogTitle;
    var Text: typeof AlertDialogText;
    var ConfirmButton: typeof AlertDialogConfirmButton;
    var DismissButton: typeof AlertDialogDismissButton;
    var Icon: typeof AlertDialogIcon;
}
export { AlertDialogComponent as AlertDialog };
export type { DialogProperties };
//# sourceMappingURL=index.d.ts.map