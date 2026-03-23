import { SharedObject } from 'expo-modules-core';
/**
 * Observable state for a Toggle, shared between JavaScript and SwiftUI.
 */
export declare class ToggleState extends SharedObject {
    /**
     * The current on/off value of the toggle.
     */
    isOn: boolean;
}
/**
 * Creates a `ToggleState` that is automatically cleaned up when the component unmounts.
 *
 * @example
 * ```tsx
 * const state = useToggleState(false);
 * return <Toggle state={state} label="Airplane Mode" />;
 * ```
 */
export declare function useToggleState(initialValue?: boolean): ToggleState;
//# sourceMappingURL=state.d.ts.map