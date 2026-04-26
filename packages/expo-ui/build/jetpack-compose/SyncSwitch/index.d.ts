import { type ObservableState } from '../../State/useNativeState';
import { type ModifierConfig } from '../../types';
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
/**
 * A switch driven by observable native state.
 * Use `useNativeState(false)` to create the state.
 */
export declare function SyncSwitch(props: SyncSwitchProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map