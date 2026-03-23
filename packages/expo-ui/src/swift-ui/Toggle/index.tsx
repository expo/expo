import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';
import { type SFSymbol } from 'sf-symbols-typescript';

import { createViewModifierEventListener } from '../modifiers/utils';
import { getStateId } from '../State';
import { type ToggleState } from './state';
import { type CommonViewModifierProps } from '../types';

export type ToggleProps = {
  /**
   * An observable SwiftUI state object that drives the toggle.
   * Create one with `useToggleState()`.
   */
  state?: ToggleState;
  /**
   * A Boolean value that determines the on/off state of the toggle.
   */
  isOn?: boolean;
  /**
   * A string that describes the purpose of the toggle.
   */
  label?: string;
  /**
   * The name of the SF Symbol to display alongside the label.
   */
  systemImage?: SFSymbol;
  /**
   * A callback that is called when the toggle's state changes.
   * @param isOn The new state of the toggle.
   */
  onIsOnChange?: (isOn: boolean) => void;
  /**
   * Custom content for the toggle label. Use multiple `Text` views where
   * the first represents the title and the second represents the subtitle.
   */
  children?: React.ReactNode;
} & CommonViewModifierProps;

type NativeToggleProps = Omit<ToggleProps, 'onIsOnChange' | 'state'> & {
  state?: number;
  onIsOnChange: (event: NativeSyntheticEvent<{ isOn: boolean }>) => void;
};

const ToggleNativeView: React.ComponentType<NativeToggleProps> = requireNativeView(
  'ExpoUI',
  'ToggleView'
);

/**
 * A control that toggles between on and off states.
 */
export function Toggle(props: ToggleProps) {
  const { children, onIsOnChange, state, modifiers, ...restProps } = props;

  const baseProps = {
    ...restProps,
    state: getStateId(state),
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    onIsOnChange: ({ nativeEvent: { isOn } }: NativeSyntheticEvent<{ isOn: boolean }>) => {
      onIsOnChange?.(isOn);
    },
  };

  return <ToggleNativeView {...baseProps}>{children}</ToggleNativeView>;
}

export { ToggleState, useToggleState } from './state';
