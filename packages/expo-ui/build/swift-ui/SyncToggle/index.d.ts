import { type SFSymbol } from 'sf-symbols-typescript';
import { type ObservableState } from '../../State/useNativeState';
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
/**
 * A toggle driven by observable native state.
 * Use `useNativeState(false)` to create the state.
 */
export declare function SyncToggle(props: SyncToggleProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map