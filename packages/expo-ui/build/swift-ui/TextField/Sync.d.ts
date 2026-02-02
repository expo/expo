import { type CommonViewModifierProps } from '../types';
type SyncTextFieldProps = {
    onChangeTextSync?: (value: string) => void;
} & CommonViewModifierProps;
export type NativeSyncTextFieldProps = Omit<SyncTextFieldProps, 'onChangeText' | 'onSubmit' | 'onChangeTextSync'> & {} & {
    onChangeTextSync?: number;
};
/**
 * Renders a `TextField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export declare function TextField(props: SyncTextFieldProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Sync.d.ts.map