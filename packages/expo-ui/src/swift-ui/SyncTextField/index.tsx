import { requireNativeView } from 'expo';
import { useEffect } from 'react';
import { SwiftUIState, registerOnChange } from "../SwiftUIState";

type NativeSyncTextFieldProps = {
  stateId: number;
}

type SyncTextFieldProps = {
  state: SwiftUIState<string>;
  onChangeSync?: (value: string) => void;
}

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export function SyncTextField(props: SyncTextFieldProps) {
  const { state, onChangeSync } = props;

  useEffect(() => {
    if (!onChangeSync) return;
    const unsubscribe = registerOnChange(state.stateId, onChangeSync);
    return unsubscribe;
  }, [state.stateId, onChangeSync]);

  return (
    <SyncTextFieldNativeView
      stateId={state.stateId}
    />
  );
}