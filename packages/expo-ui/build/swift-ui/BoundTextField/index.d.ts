import { NativeStateRef } from '../hooks/useNativeState';
import { CommonViewModifierProps } from '../types';
export type BoundTextFieldProps = {
    value: NativeStateRef<string>;
    placeholder?: string;
} & CommonViewModifierProps;
export declare function BoundTextField({ value, placeholder, ...rest }: BoundTextFieldProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map