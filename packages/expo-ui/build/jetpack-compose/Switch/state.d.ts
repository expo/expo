import { SharedObject } from 'expo-modules-core';
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
export declare function useToggleState(initialValue?: boolean): ToggleState;
//# sourceMappingURL=state.d.ts.map