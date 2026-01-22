import { requireNativeView } from 'expo';

import { NativeStateRef } from '../hooks/useNativeState';
import { CommonViewModifierProps } from '../types';

export type BoundTextFieldProps = {
  value: NativeStateRef;
  placeholder?: string;
} & CommonViewModifierProps;

type NativeBoundTextFieldProps = {
  stateId: string;
  initialValue: string;
  placeholder?: string;
} & CommonViewModifierProps;

const NativeView: React.ComponentType<NativeBoundTextFieldProps> = requireNativeView(
  'ExpoUI',
  'BoundTextFieldView'
);

export function BoundTextField({ value, placeholder, ...rest }: BoundTextFieldProps) {
  return (
    <NativeView
      stateId={value.__nativeStateId}
      initialValue={value.__initialValue}
      placeholder={placeholder}
      {...rest}
    />
  );
}
