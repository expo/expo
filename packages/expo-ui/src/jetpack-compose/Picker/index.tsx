import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';

/**
 * Colors for picker's core elements.
 */
export type PickerElementColors = {
  activeBorderColor?: string;
  activeContentColor?: string;
  inactiveBorderColor?: string;
  inactiveContentColor?: string;
  disabledActiveBorderColor?: string;
  disabledActiveContentColor?: string;
  disabledInactiveBorderColor?: string;
  disabledInactiveContentColor?: string;
  activeContainerColor?: string;
  inactiveContainerColor?: string;
  disabledActiveContainerColor?: string;
  disabledInactiveContainerColor?: string;
};

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
   * Callback function that is called when an option is selected.
   */
  onOptionSelected?: (event: { nativeEvent: { index: number; label: string } }) => void;
  /**
   * The variant of the picker, which determines its appearance and behavior.
   * @default 'segmented'
   */
  variant?: 'segmented' | 'radio';

  /**
   * Colors for picker's core elements.
   */
  elementColors?: PickerElementColors;
  /**
   * Picker color.
   */
  color?: string;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
  /** Modifiers for the individual buttons */
  buttonModifiers?: ExpoModifier[];
};

const PickerNativeView: React.ComponentType<PickerProps> = requireNativeView(
  'ExpoUI',
  'PickerView'
);

type NativePickerProps = PickerProps;

/**
 * @hidden
 */
export function transformPickerProps(props: PickerProps): NativePickerProps {
  return {
    ...props,
    variant: props.variant ?? 'segmented',
    elementColors: props.elementColors
      ? props.elementColors
      : props.color
        ? {
            activeContainerColor: props.color,
          }
        : undefined,
    color: props.color,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    // @ts-expect-error
    buttonModifiers: props.buttonModifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Displays a native picker component. Depending on the variant it can be a segmented button, an inline picker, a list of choices or a radio button.
 */
export function Picker(props: PickerProps) {
  return <PickerNativeView {...transformPickerProps(props)} />;
}
