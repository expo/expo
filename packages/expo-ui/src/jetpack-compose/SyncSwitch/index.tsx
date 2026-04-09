import { requireNativeView } from 'expo';

import { type ObservableState } from '../../State/useNativeState';
import { getStateId } from '../../State/utils';
import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type SyncSwitchProps = {
  /**
   * An observable state that drives the switch.
   * Create one with `useNativeState(false)`.
   */
  isOn: ObservableState<boolean>;
  /**
   * Whether the switch is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeSyncSwitchProps = Omit<SyncSwitchProps, 'isOn'> & {
  isOn?: number | null;
};

const SyncSwitchNativeView: React.ComponentType<NativeSyncSwitchProps> = requireNativeView(
  'ExpoUI',
  'SyncSwitchView'
);

/**
 * A switch driven by observable native state.
 * Use `useNativeState(false)` to create the state.
 */
export function SyncSwitch(props: SyncSwitchProps) {
  const { isOn, modifiers, ...restProps } = props;

  return (
    <SyncSwitchNativeView
      {...restProps}
      isOn={getStateId(isOn)}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}
