import { requireNativeView } from 'expo';
import type { NativeSyntheticEvent } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

type SelectionValueType = string | number | null;
export type PickerProps<T extends SelectionValueType = any> = {
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
  selection?: T;
  /**
   * Callback function that is called when an option is selected.
   * Gets called with the selected `tag` value.
   */
  onSelectionChange?: (selection: T) => void;

  /**
   * The content of the picker. You can use `Text` components with `tag` modifiers to display the options.
   */
  children?: React.ReactNode;
} & CommonViewModifierProps;

type NativePickerProps = Omit<PickerProps, 'onSelectionChange'> & {
  onSelectionChange?: (event: NativeSyntheticEvent<{ selection: SelectionValueType }>) => void;
  children?: React.ReactNode;
};

const PickerNativeView: React.ComponentType<NativePickerProps> = requireNativeView(
  'ExpoUI',
  'PickerView'
);

const PickerContentNativeView: React.ComponentType<{ children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'PickerContentView');

const PickerLabelNativeView: React.ComponentType<{ children: React.ReactNode }> = requireNativeView(
  'ExpoUI',
  'PickerLabelView'
);

function transformPickerProps<T extends SelectionValueType>(
  props: PickerProps<T>
): NativePickerProps {
  const { modifiers, onSelectionChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onSelectionChange: onSelectionChange
      ? ({ nativeEvent: { selection } }) => {
          onSelectionChange(selection as T);
        }
      : undefined,
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
export function Picker<T extends SelectionValueType>(props: PickerProps<T>) {
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
