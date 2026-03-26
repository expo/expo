import { requireNativeModule } from 'expo';
import { SharedObject, useReleasingSharedObject } from 'expo-modules-core';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state for a Switch, shared between JavaScript and Compose.
 */
export declare class ToggleState extends SharedObject {
  /**
   * The current on/off value of the switch.
   */
  isOn: boolean;
}

/**
 * Creates a `ToggleState` that is automatically cleaned up when the component unmounts.
 *
 * @example
 * ```tsx
 * const state = useToggleState(false);
 * return <Switch state={state} />;
 * ```
 */
export function useToggleState(initialValue: boolean = false): ToggleState {
  return useReleasingSharedObject(() => {
    return new ExpoUI.ToggleState(initialValue) as ToggleState;
  }, [initialValue]);
}
