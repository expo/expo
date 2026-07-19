import { requireNativeView } from 'expo';
import type { NativeSyntheticEvent } from 'react-native';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * Props of the `Alert` component.
 */
export interface AlertProps extends CommonViewModifierProps {
  /**
   * The contents of the alert.
   * Should include `Alert.Trigger`, `Alert.Actions`, and optionally `Alert.Message`.
   */
  children: React.ReactNode;
  /**
   * The title of the alert.
   */
  title: string;
  /**
   * Whether the alert is presented.
   */
  isPresented?: boolean;
  /**
   * A callback that is called when the `isPresented` state changes.
   */
  onIsPresentedChange?: (isPresented: boolean) => void;
}

type NativeAlertProps = Omit<AlertProps, 'onIsPresentedChange'> & {
  onIsPresentedChange?: (event: NativeSyntheticEvent<{ isPresented: boolean }>) => void;
};

const AlertNativeView: React.ComponentType<NativeAlertProps> = requireNativeView(
  'ExpoUI',
  'AlertView'
);

/**
 * The component visible all the time that triggers the alert presentation.
 */
function Trigger(props: { children: React.ReactNode }) {
  return <Slot name="trigger">{props.children}</Slot>;
}

/**
 * The action buttons displayed in the alert. Use `Button` components from `@expo/ui/swift-ui` as children.
 */
function Actions(props: { children: React.ReactNode }) {
  return <Slot name="actions">{props.children}</Slot>;
}

/**
 * An optional message displayed below the title in the alert.
 */
function Message(props: { children: React.ReactNode }) {
  return <Slot name="message">{props.children}</Slot>;
}

/**
 * `Alert` presents a SwiftUI alert with a title, optional message, and action buttons.
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/alert(_:ispresented:actions:message:)).
 */
function Alert(props: AlertProps) {
  const { onIsPresentedChange, modifiers, children, ...restProps } = props;

  const handleIsPresentedChange = (event: NativeSyntheticEvent<{ isPresented: boolean }>) => {
    onIsPresentedChange?.(event.nativeEvent.isPresented);
  };

  return (
    <AlertNativeView
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onIsPresentedChange={handleIsPresentedChange}>
      {children}
    </AlertNativeView>
  );
}

Alert.Trigger = Trigger;
Alert.Actions = Actions;
Alert.Message = Message;

export { Alert };
