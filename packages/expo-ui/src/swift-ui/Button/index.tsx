import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';

export type ButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;
  /**
   * A string describing the system image to display in the button.
   * This is only used if `label` is string.
   */
  systemImage?: SFSymbol;
  /**
   * Indicates the role of the button.
   */
  role?: ButtonRole;
  /**
   * The label that describes the button's action. This can be a string or a custom view.
   */
  label?: string | React.ReactNode;
} & CommonViewModifierProps;

/**
 * @hidden
 */
export type NativeButtonProps = Omit<ButtonProps, 'onPress'> & ViewEvent<'onButtonPress', void>;

const ButtonNativeView: React.ComponentType<NativeButtonProps> = requireNativeView(
  'ExpoUI',
  'Button'
);

/**
 * Displays a native button component.
 *
 * @example
 * ```tsx
 * import { Button } from '@expo/ui/swift-ui';
 * import { buttonStyle, controlSize, tint, disabled } from '@expo/ui/swift-ui/modifiers';
 *
 * <Button
 *   role="destructive"
 *   onPress={handlePress}
 *   label="Delete"
 *   modifiers={[
 *     buttonStyle('bordered'),
 *     controlSize('large'),
 *     tint('#FF0000'),
 *     disabled(true)
 *   ]}
 * />
 * ```
 */
export function Button(props: ButtonProps) {
  const { label, onPress, modifiers, ...restProps } = props;

  const baseProps = {
    ...restProps,
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    onButtonPress: onPress,
  };

  if (typeof label === 'string') {
    return <ButtonNativeView {...baseProps} label={label} />;
  }

  return <ButtonNativeView {...baseProps}>{label}</ButtonNativeView>;
}
