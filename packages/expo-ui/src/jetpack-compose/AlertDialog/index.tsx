import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';

export type AlertDialogButtonColors = {
  /**
   * The background color of the button.
   */
  containerColor?: ColorValue;
  /**
   * The text color of the button.
   */
  contentColor?: ColorValue;
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
   * The colors for the confirm button.
   */
  confirmButtonColors?: AlertDialogButtonColors;
  /**
   * The colors for the dismiss button.
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

const AlertDialogNativeView: React.ComponentType<NativeAlertDialogProps> = requireNativeView(
  'ExpoUI',
  'AlertDialogView'
);

/**
 * Renders an `AlertDialog` component.
 */
export function AlertDialog(props: AlertDialogProps) {
  return <AlertDialogNativeView {...props} />;
}
