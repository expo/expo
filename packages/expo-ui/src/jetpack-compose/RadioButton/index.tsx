import { requireNativeView } from 'expo';

import { type ModifierConfig, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type RadioButtonProps = {
  /**
   * Whether the radio button is selected.
   */
  selected: boolean;
  /**
   * Callback that is called when the radio button is clicked.
   */
  onClick?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

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
