import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { type ObservableState } from '../State/useNativeState';
import { getStateId } from '../State/utils';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SyncToggleProps = {
  /**
   * An observable state that drives the toggle.
   * Create one with `useNativeState(false)`.
   */
  isOn: ObservableState<boolean>;
  /**
   * A string that describes the purpose of the toggle.
   */
  label?: string;
  /**
   * The name of the SF Symbol to display alongside the label.
   */
  systemImage?: SFSymbol;
} & CommonViewModifierProps;

type NativeSyncToggleProps = Omit<SyncToggleProps, 'isOn'> & {
  isOn?: number;
};

const SyncToggleNativeView: React.ComponentType<NativeSyncToggleProps> = requireNativeView(
  'ExpoUI',
  'SyncToggleView'
);

/**
 * A toggle driven by observable native state.
 * Use `useNativeState(false)` to create the state.
 */
export function SyncToggle(props: SyncToggleProps) {
  const { isOn, modifiers, ...restProps } = props;

  return (
    <SyncToggleNativeView
      {...restProps}
      isOn={getStateId(isOn)}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}
