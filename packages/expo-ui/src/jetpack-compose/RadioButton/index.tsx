import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import { type ModifierConfig, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for the radio button in different states.
 */
export type RadioButtonColors = {
  selectedColor?: ColorValue;
  unselectedColor?: ColorValue;
  disabledSelectedColor?: ColorValue;
  disabledUnselectedColor?: ColorValue;
};

export interface RadioButtonProps {
  /**
   * Whether the radio button is selected.
   */
  selected: boolean;
  /**
   * Whether the radio button is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback that is called when the radio button is clicked.
   */
  onClick?: () => void;
  /**
   * Colors for the radio button in different states.
   */
  colors?: RadioButtonColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
}

type NativeRadioButtonProps = Omit<RadioButtonProps, 'onClick'> &
  ViewEvent<'onButtonPressed', void> & {
    clickable: boolean;
  };

const RadioButtonNativeView: React.ComponentType<NativeRadioButtonProps> = requireNativeView(
  'ExpoUI',
  'RadioButtonView'
);

function transformProps(props: RadioButtonProps): NativeRadioButtonProps {
  const { modifiers, onClick, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    clickable: onClick != null,
    onButtonPressed: () => onClick?.(),
  };
}

/**
 * A Material Design radio button.
 */
export function RadioButton(props: RadioButtonProps) {
  return <RadioButtonNativeView {...transformProps(props)} />;
}
