import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { type ObservableState } from '../../State/useNativeState';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
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
  /**
   * A worklet callback that runs synchronously on the UI thread when the toggle changes.
   * Must be marked with the `'worklet'` directive.
   */
  onIsOnChangeSync?: (isOn: boolean) => void;
} & CommonViewModifierProps;

type NativeSyncToggleProps = Omit<SyncToggleProps, 'isOn' | 'onIsOnChangeSync'> & {
  isOn?: number | null;
  onIsOnChangeSync?: number | null;
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
  const { isOn, onIsOnChangeSync, modifiers, ...restProps } = props;
  const workletCallback = useWorkletProp(onIsOnChangeSync, 'onIsOnChangeSync');

  return (
    <SyncToggleNativeView
      {...restProps}
      isOn={getStateId(isOn)}
      onIsOnChangeSync={getStateId(workletCallback)}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}
