import { requireNativeView } from 'expo';
import { useSwiftUIState } from "../SwiftUIState";


type NativeSyncTextFieldProps = {
  stateId: number;
}

type SyncTextFieldProps = {
  state: ReturnType<typeof useSwiftUIState<string>>;
}

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export function SyncTextField(props: SyncTextFieldProps) {
  const { state } = props;

  return (
    <SyncTextFieldNativeView
      stateId={state.stateId}
    />
  );
}