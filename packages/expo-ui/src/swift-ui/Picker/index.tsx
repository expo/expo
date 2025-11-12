import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type PickerProps = {
  /**
   * A label displayed on the picker.
   */
  label?: string | React.ReactNode;
  /**
   * The selected optio `tag` value.
   */
  selection?: string;
  /**
   * Callback function that is called when an option is selected.
   * Gets called with the selected `tag` value.
   */
  onSelectionChange?: (event: { nativeEvent: { selection: string } }) => void;

  /**
   * The content of the picker.
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
 */
export function Picker(props: PickerProps) {
  const { label, children, ...restProps } = transformPickerProps(props);
  if (typeof label === 'string') {
    return (
      <PickerNativeView {...restProps} label={label}>
        {children}
      </PickerNativeView>
    );
  } else {
    return (
      <PickerNativeView {...restProps}>
        <PickerLabelNativeView>{label}</PickerLabelNativeView>
        {children}
      </PickerNativeView>
    );
  }
}

export namespace Picker {
  export const Content = PickerContentNativeView;
}
