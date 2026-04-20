import { type CommonViewModifierProps } from '../types';
/**
 * Props of the `ConfirmationDialog` component.
 */
export type ConfirmationDialogProps = {
    /**
     * The contents of the confirmation dialog.
     * Should include `ConfirmationDialog.Trigger`, `ConfirmationDialog.Actions`, and optionally `ConfirmationDialog.Message`.
     */
    children: React.ReactNode;
    /**
     * The title of the confirmation dialog.
     */
    title: string;
    /**
     * Whether the confirmation dialog is presented.
     */
    isPresented?: boolean;
    /**
     * A callback that is called when the `isPresented` state changes.
     */
    onIsPresentedChange?: (isPresented: boolean) => void;
    /**
     * The visibility of the dialog title.
     * @default 'automatic'
     */
    titleVisibility?: 'automatic' | 'visible' | 'hidden';
} & CommonViewModifierProps;
/**
 * `ConfirmationDialog` presents a confirmation dialog with a title, optional message, and action buttons.
 *
 * @see https://developer.apple.com/documentation/swiftui/view/confirmationdialog(_:ispresented:titlevisibility:actions:message:)
 */
declare function ConfirmationDialog(props: ConfirmationDialogProps): import("react").JSX.Element;
declare namespace ConfirmationDialog {
    var Trigger: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
    var Actions: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
    var Message: (props: {
        children: React.ReactNode;
    }) => import("react").JSX.Element;
}
export { ConfirmationDialog };
//# sourceMappingURL=index.d.ts.map