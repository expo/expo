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
 * It is the SwiftUI equivalent of an action sheet / alert confirmation.
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   title="Delete Item?"
 *   isPresented={isPresented}
 *   onIsPresentedChange={setIsPresented}
 *   titleVisibility="visible">
 *   <ConfirmationDialog.Trigger>
 *     <Button title="Delete" onPress={() => setIsPresented(true)} />
 *   </ConfirmationDialog.Trigger>
 *   <ConfirmationDialog.Actions>
 *     <Button title="Confirm Delete" role="destructive" onPress={() => handleDelete()} />
 *     <Button title="Cancel" role="cancel" />
 *   </ConfirmationDialog.Actions>
 *   <ConfirmationDialog.Message>
 *     <Text>Are you sure you want to delete this item? This action cannot be undone.</Text>
 *   </ConfirmationDialog.Message>
 * </ConfirmationDialog>
 * ```
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