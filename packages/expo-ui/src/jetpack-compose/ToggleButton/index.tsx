import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ExpoModifier, type ViewEvent } from '../../types';
import { ExpoUIModule } from '../ExpoUIModule';
import { createViewModifierEventListener } from '../modifiers/utils';

export type ToggleButtonProps = {
  /**
   * Whether the toggle button is checked.
   */
  checked: boolean;
  /**
   * Text to display in the button.
   */
  text?: string;
  /**
   * The variant of the toggle button.
   * - `'default'` - Material 3 ToggleButton
   * - `'icon'` - Icon toggle button
   * - `'filledIcon'` - Filled icon toggle button
   * - `'outlinedIcon'` - Outlined icon toggle button
   * @default 'default'
   */
  variant?: 'default' | 'icon' | 'filledIcon' | 'outlinedIcon';
  /**
   * The color of the toggle button when checked.
   */
  color?: ColorValue;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
  /**
   * Callback that is called when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * The content to display inside the toggle button.
   */
  children?: React.ReactNode;
};

type NativeToggleButtonProps = Omit<ToggleButtonProps, 'onCheckedChange'> &
  ViewEvent<'onCheckedChange', { checked: boolean }>;

const ToggleButtonNativeView: React.ComponentType<NativeToggleButtonProps> = requireNativeView(
  'ExpoUI',
  'ToggleButtonView'
);

function transformProps(props: ToggleButtonProps): Omit<NativeToggleButtonProps, 'children'> {
  const { modifiers, onCheckedChange, children, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onCheckedChange: onCheckedChange
      ? ({ nativeEvent: { checked } }) => onCheckedChange(checked)
      : undefined,
  };
}
/**
 * A toggle button component that can be toggled on and off.
 *
 * When `text` prop is provided, it displays the text.
 * Otherwise, custom children can be passed to render custom content.
 */
function ToggleButton(props: ToggleButtonProps) {
  const { children } = props;

  return <ToggleButtonNativeView {...transformProps(props)}>{children}</ToggleButtonNativeView>;
}

ToggleButton.DefaultIconSpacing = ExpoUIModule.ToggleButtonIconSpacing;
ToggleButton.DefaultIconSize = ExpoUIModule.ToggleButtonIconSize;

export { ToggleButton };
