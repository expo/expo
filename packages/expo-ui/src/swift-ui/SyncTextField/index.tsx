import { requireNativeView } from 'expo';
import { forwardRef, useImperativeHandle } from 'react';

import { useUIStateRegistry } from '../UIStateRegistry';

type NativeSyncTextFieldProps = {
  viewId: string;
  defaultValue: string;
};

export type SyncTextFieldRef = {
  setState: (value: string) => void;
  getState: () => string;
};

type SyncTextFieldProps = {
  defaultValue?: string;
  onChangeSync?: (value: string) => string | void;
};

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export const SyncTextField = forwardRef<SyncTextFieldRef, SyncTextFieldProps>((props, ref) => {
  const { defaultValue = '', onChangeSync } = props;

  const { viewId, setState, getState } = useUIStateRegistry({
    onChangeSync,
  });

  useImperativeHandle(ref, () => ({ setState, getState }), [setState, getState]);

  return <SyncTextFieldNativeView viewId={viewId} defaultValue={defaultValue} />;
});