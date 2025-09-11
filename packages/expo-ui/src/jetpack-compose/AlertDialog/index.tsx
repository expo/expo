import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';

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

  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
};

export type NativeAlertDialogProps = AlertDialogProps;

const AlertDialogNativeView: React.ComponentType<NativeAlertDialogProps> = requireNativeView(
  'ExpoUI',
  'AlertDialogView'
);

/**
 * Renders an `AlertDialog` component.
 */
export function AlertDialog(props: AlertDialogProps) {
  return (
    <AlertDialogNativeView
      {...props}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
