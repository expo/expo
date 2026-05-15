import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ViewEvent, type ModifierConfig, type DialogProperties } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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

type NativeAlertDialogProps = Omit<AlertDialogProps, 'onDismissRequest'> &
  ViewEvent<'onDismissRequest', { onDismissRequest?: () => void }>;

const AlertDialogNativeView: React.ComponentType<NativeAlertDialogProps> = requireNativeView(
  'ExpoUI',
  'AlertDialogView'
);

const SlotNativeView: React.ComponentType<{ slotName: string; children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'SlotView');

function transformProps(
  props: Omit<AlertDialogProps, 'children'>
): Omit<NativeAlertDialogProps, 'children'> {
  const { modifiers, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onDismissRequest: () => {
      onDismissRequest?.();
    },
  };
}

/**
 * The title slot of the `AlertDialog`.
 */
function AlertDialogTitle(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="title">{props.children}</SlotNativeView>;
}

/**
 * The text (body) slot of the `AlertDialog`.
 */
function AlertDialogText(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="text">{props.children}</SlotNativeView>;
}

/**
 * The confirm button slot of the `AlertDialog`.
 */
function AlertDialogConfirmButton(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="confirmButton">{props.children}</SlotNativeView>;
}

/**
 * The dismiss button slot of the `AlertDialog`.
 */
function AlertDialogDismissButton(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="dismissButton">{props.children}</SlotNativeView>;
}

/**
 * The icon slot of the `AlertDialog`.
 */
function AlertDialogIcon(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="icon">{props.children}</SlotNativeView>;
}

/**
 * Renders an `AlertDialog` component with slot-based content matching the Compose API.
 * Content is provided via slot sub-components: `AlertDialog.Title`, `AlertDialog.Text`,
 * `AlertDialog.ConfirmButton`, `AlertDialog.DismissButton`, and `AlertDialog.Icon`.
 */
function AlertDialogComponent(props: AlertDialogProps) {
  const { children, ...restProps } = props;
  return <AlertDialogNativeView {...transformProps(restProps)}>{children}</AlertDialogNativeView>;
}

AlertDialogComponent.Title = AlertDialogTitle;
AlertDialogComponent.Text = AlertDialogText;
AlertDialogComponent.ConfirmButton = AlertDialogConfirmButton;
AlertDialogComponent.DismissButton = AlertDialogDismissButton;
AlertDialogComponent.Icon = AlertDialogIcon;

export { AlertDialogComponent as AlertDialog };

// Re-exported so the docs generator includes DialogProperties on the AlertDialog API page.
export type { DialogProperties };
