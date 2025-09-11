import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type PickerProps = {
  /**
   * An array of options to be displayed in the picker.
   */
  options: string[];
  /**
   * The index of the currently selected option.
   */
  selectedIndex: number | null;
  /**
   * A label displayed on the picker when in `'menu'` variant inside a form section on iOS.
   */
  label?: string;
  /**
   * Callback function that is called when an option is selected.
   */
  onOptionSelected?: (event: { nativeEvent: { index: number; label: string } }) => void;
  /**
   * The variant of the picker, which determines its appearance and behavior.
   * The `'wheel'`, `'inline'`, `'palette'` and `'menu'` variants are iOS only, the `'radio'` variant is Android only. The `'inline'` variant can only be used inside sections or lists. The `'palette'` variant displays differently inside menus.
   * @default 'segmented'
   */
  variant?: 'wheel' | 'segmented' | 'menu' | 'inline' | 'palette';
  /**
   * Picker color. On iOS it only applies to the `'menu'` variant.
   */
  color?: string;
} & CommonViewModifierProps;

const PickerNativeView: React.ComponentType<PickerProps> = requireNativeView(
  'ExpoUI',
  'PickerView'
);

type NativePickerProps = PickerProps;

function transformPickerProps(props: PickerProps): NativePickerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    variant: props.variant ?? 'segmented',
    color: props.color,
  };
}

/**
 * Displays a native picker component. Depending on the variant it can be a segmented button, an inline picker, a list of choices or a radio button.
 */
export function Picker(props: PickerProps) {
  return <PickerNativeView {...transformPickerProps(props)} />;
}
