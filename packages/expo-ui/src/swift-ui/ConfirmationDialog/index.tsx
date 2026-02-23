import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
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

type NativeConfirmationDialogProps = Omit<ConfirmationDialogProps, 'onIsPresentedChange'> & {
  onIsPresentedChange?: (event: NativeSyntheticEvent<{ isPresented: boolean }>) => void;
};

const ConfirmationDialogNativeView: React.ComponentType<NativeConfirmationDialogProps> =
  requireNativeView('ExpoUI', 'ConfirmationDialogView');

const ConfirmationDialogNativeTrigger: React.ComponentType<{ children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'ConfirmationDialogTrigger');

const ConfirmationDialogNativeActions: React.ComponentType<{ children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'ConfirmationDialogActions');

const ConfirmationDialogNativeMessage: React.ComponentType<{ children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'ConfirmationDialogMessage');

/**
 * The component visible all the time that triggers the confirmation dialog presentation.
 */
function Trigger(props: { children: React.ReactNode }) {
  return <ConfirmationDialogNativeTrigger {...props} />;
}

/**
 * The action buttons displayed in the confirmation dialog. Use `Button` components from `@expo/ui/swift-ui` as children.
 */
function Actions(props: { children: React.ReactNode }) {
  return <ConfirmationDialogNativeActions {...props} />;
}

/**
 * An optional message displayed below the title in the confirmation dialog.
 */
function Message(props: { children: React.ReactNode }) {
  return <ConfirmationDialogNativeMessage {...props} />;
}

/**
 * `ConfirmationDialog` presents a confirmation dialog with a title, optional message, and action buttons.
 *
 * @see https://developer.apple.com/documentation/swiftui/view/confirmationdialog(_:ispresented:titlevisibility:actions:message:)
 */
function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { onIsPresentedChange, modifiers, children, ...restProps } = props;

  const handleIsPresentedChange = (event: NativeSyntheticEvent<{ isPresented: boolean }>) => {
    onIsPresentedChange?.(event.nativeEvent.isPresented);
  };

  return (
    <ConfirmationDialogNativeView
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onIsPresentedChange={handleIsPresentedChange}>
      {children}
    </ConfirmationDialogNativeView>
  );
}

ConfirmationDialog.Trigger = Trigger;
ConfirmationDialog.Actions = Actions;
ConfirmationDialog.Message = Message;

export { ConfirmationDialog };
