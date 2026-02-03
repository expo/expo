import { requireNativeView } from 'expo';
import { type CommonViewModifierProps } from '../types';
import { createSerializable } from 'react-native-worklets';

import { useReleasingSharedObject, createWorkletCallback } from 'expo-modules-core';

type SyncTextFieldProps = {
  onChangeTextSync?: (value: string) => void;
} & CommonViewModifierProps;

export type NativeSyncTextFieldProps = Omit<
  SyncTextFieldProps,
  'onChangeText' | 'onSubmit' | 'onChangeTextSync'
> & {} & {
  onChangeTextSync?: number;
};

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

export function SyncTextField(props: SyncTextFieldProps) {
  const { onChangeTextSync, ...restProps } = props;
  const callback = useReleasingSharedObject(
    () =>
      createWorkletCallback && onChangeTextSync
        ? createWorkletCallback(createSerializable(onChangeTextSync))
        : null,
    [onChangeTextSync]
  );

  return (
    <SyncTextFieldNativeView
      {...restProps}
      onChangeTextSync={callback?.__expo_shared_object_id__ as number | undefined}
    />
  );
}
