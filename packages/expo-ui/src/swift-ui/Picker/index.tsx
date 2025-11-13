import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { SFSymbol } from 'sf-symbols-typescript';

export type PickerProps = {
  /**
   * The name of the system image (SF Symbol).
   * For example: 'photo', 'heart.fill', 'star.circle'
   */
  systemImage?: SFSymbol;
  /**
   * A label displayed on the picker.
   */
  label?: string | React.ReactNode;
  /**
   * The selected option's `tag` modifier value.
   */
  selection?: string | number;
  /**
   * Callback function that is called when an option is selected.
   * Gets called with the selected `tag` value.
   */
  onSelectionChange?: (event: { nativeEvent: { selection: string | number } }) => void;

  /**
   * The content of the picker. You can use `Text` components with `tag` modifiers to display the options.
   */
  children?: React.ReactNode;
} & CommonViewModifierProps;

const PickerNativeView: React.ComponentType<PickerProps> = requireNativeView(
  'ExpoUI',
  'PickerView'
);

export const PickerContentNativeView: React.ComponentType<PickerProps> = requireNativeView(
  'ExpoUI',
  'PickerContentView'
);

const PickerLabelNativeView: React.ComponentType<PickerProps> = requireNativeView(
  'ExpoUI',
  'PickerLabelView'
);

type NativePickerProps = PickerProps;

function transformPickerProps(props: PickerProps): NativePickerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Displays a native picker component
 * @example
 * ```tsx
 * <Picker modifiers={[pickerStyle('segmented')]}>
 *   <Text modifiers={[tag('option1')]}>Option 1</Text>
 *   <Text modifiers={[tag(0)]}>Option 3</Text>
 * </Picker>
 * ```
 */
export function Picker(props: PickerProps) {
  const { label, children, ...restProps } = transformPickerProps(props);
  if (typeof label === 'string') {
    return (
      <PickerNativeView {...restProps} label={label}>
        <PickerContentNativeView>{children}</PickerContentNativeView>
      </PickerNativeView>
    );
  } else {
    return (
      <PickerNativeView {...restProps}>
        <PickerLabelNativeView>{label}</PickerLabelNativeView>
        <PickerContentNativeView>{children}</PickerContentNativeView>
      </PickerNativeView>
    );
  }
}
