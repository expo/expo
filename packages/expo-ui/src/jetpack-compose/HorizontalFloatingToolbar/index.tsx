import { requireNativeView } from 'expo';

import { ExpoModifier, ViewEvent } from '../../types';

export type HorizontalFloatingToolbarProps = {
  /**
   * The variant of the horizontal floating toolbar.
   * @default 'standard'
   */
  variant?: 'standard' | 'vibrant';

  /**
   * The children of the component.
   */
  children: React.ReactNode;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type FloatingActionButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;

  /**
   * The children of the component.
   */
  children: React.ReactNode;
};

type NativeHorizontalFloatingToolbarProps = HorizontalFloatingToolbarProps & {};
type NativeFloatingActionButtonProps = Omit<FloatingActionButtonProps, 'onPress'> &
  ViewEvent<'onButtonPressed', void>;

const HorizontalFloatingToolbarNativeView: React.ComponentType<NativeHorizontalFloatingToolbarProps> =
  requireNativeView('ExpoUI', 'HorizontalFloatingToolbarView');

const FloatingActionButtonNativeView: React.ComponentType<NativeFloatingActionButtonProps> =
  requireNativeView('ExpoUI', 'FloatingActionButtonView');

/**
 * FloatingActionButton component for HorizontalFloatingToolbar.
 * This component wraps the floating action button content.
 */
function FloatingActionButton(props: FloatingActionButtonProps) {
  const { onPress, ...restProps } = props;
  return <FloatingActionButtonNativeView {...restProps} onButtonPressed={onPress} />;
}

function transformHorizontalFloatingToolbarProps(
  props: HorizontalFloatingToolbarProps
): NativeHorizontalFloatingToolbarProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps) {
  return (
    <HorizontalFloatingToolbarNativeView {...transformHorizontalFloatingToolbarProps(props)} />
  );
}

HorizontalFloatingToolbar.FloatingActionButton = FloatingActionButton;

export { HorizontalFloatingToolbar };
