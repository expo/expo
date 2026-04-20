import { requireNativeView } from 'expo';

import { type ViewEvent, type ModifierConfig, type DialogProperties } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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
   * Properties for the dialog window.
   */
  properties?: DialogProperties;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeBasicAlertDialogProps = Omit<BasicAlertDialogProps, 'onDismissRequest'> &
  ViewEvent<
    'onDismissRequest',
    {
      onDismissRequest?: () => void;
    }
  >;

const BasicAlertDialogNativeView: React.ComponentType<NativeBasicAlertDialogProps> =
  requireNativeView('ExpoUI', 'BasicAlertDialogView');

function transformProps(props: BasicAlertDialogProps): NativeBasicAlertDialogProps {
  const { modifiers, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    onDismissRequest: () => {
      onDismissRequest?.();
    },
    ...restProps,
  };
}

/**
 * A basic alert dialog that provides a blank container for custom content.
 * Unlike `AlertDialog`, this component does not have structured title/text/buttons slots.
 */
export function BasicAlertDialog(props: BasicAlertDialogProps) {
  return <BasicAlertDialogNativeView {...transformProps(props)} />;
}

// Re-exported so the docs generator includes DialogProperties on the BasicAlertDialog API page.
export type { DialogProperties };
