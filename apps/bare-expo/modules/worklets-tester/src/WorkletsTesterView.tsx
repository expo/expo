import { requireNativeView } from 'expo';
import { createWorkletCallback, useReleasingSharedObject } from 'expo-modules-core';
import { createSerializable } from 'react-native-worklets';
import { type ViewStyle } from 'react-native';

type WorkletsTesterViewProps = {
  onPressSync?: (message: string) => void;
  style?: ViewStyle;
};

type NativeWorkletsTesterViewProps = Omit<WorkletsTesterViewProps, 'onPressSync'> & {
  onPressSync?: number;
};

const NativeView: React.ComponentType<NativeWorkletsTesterViewProps> =
  requireNativeView('WorkletsTesterModule');

export function WorkletsTesterView(props: WorkletsTesterViewProps) {
  const { onPressSync, ...restProps } = props;
  const callback = useReleasingSharedObject(
    () =>
      createWorkletCallback && onPressSync
        ? createWorkletCallback(createSerializable(onPressSync))
        : null,
    [onPressSync]
  );

  return <NativeView {...restProps} onPressSync={callback?.__expo_shared_object_id__} />;
}
