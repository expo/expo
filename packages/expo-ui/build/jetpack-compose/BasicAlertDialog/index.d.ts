import { type ExpoModifier } from '../../types';
export type BasicAlertDialogProps = {
    /**
     * The content to display inside the dialog.
     */
    children?: React.ReactNode;
    /**
     * Callback that is called when the user tries to dismiss the dialog
     * (e.g. by tapping outside of it or pressing the back button).
     */
    onDismissRequest?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A basic alert dialog that provides a blank container for custom content.
 * Unlike `AlertDialog`, this component does not have structured title/text/buttons slots.
 */
export declare function BasicAlertDialog(props: BasicAlertDialogProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map