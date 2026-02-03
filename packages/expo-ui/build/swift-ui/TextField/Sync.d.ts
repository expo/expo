import { type CommonViewModifierProps } from '../types';
type SyncTextFieldProps = {
    onChangeTextSync?: (value: string) => void;
} & CommonViewModifierProps;
export type NativeSyncTextFieldProps = Omit<SyncTextFieldProps, 'onChangeText' | 'onSubmit' | 'onChangeTextSync'> & {} & {
    onChangeTextSync?: number;
};
export declare function SyncTextField(props: SyncTextFieldProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Sync.d.ts.map