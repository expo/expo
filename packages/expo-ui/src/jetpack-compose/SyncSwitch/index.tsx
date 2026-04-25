import { requireNativeView } from 'expo';

import { type ObservableState } from '../../State/useNativeState';
import { useWorkletProp } from '../../State/useWorkletProp';
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
   * A worklet callback that runs synchronously on the UI thread when the switch changes.
   * Must be marked with the `'worklet'` directive.
   */
  onCheckedChangeSync?: (checked: boolean) => void;
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

type NativeSyncSwitchProps = Omit<SyncSwitchProps, 'isOn' | 'onCheckedChangeSync'> & {
  isOn?: number | null;
  onCheckedChangeSync?: number | null;
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
  const { isOn, onCheckedChangeSync, modifiers, ...restProps } = props;
  const workletCallback = useWorkletProp(onCheckedChangeSync, 'onCheckedChangeSync');

  return (
    <SyncSwitchNativeView
      {...restProps}
      isOn={getStateId(isOn)}
      onCheckedChangeSync={getStateId(workletCallback)}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}
