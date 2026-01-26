import "react-native-reanimated";
import { NativeSyntheticEvent } from "react-native";
import { installOnUIRuntime, requireNativeView } from 'expo';
import { requireNativeModule } from 'expo';
import { useSwiftUIState } from "../SwiftUIState";

installOnUIRuntime();
const ExpoUI = requireNativeModule('ExpoUI');
ExpoUI.initializeWorkletFunctions();

type StateInitializeEvent = NativeSyntheticEvent<{ stateId: number }>;

type SyncTextFieldProps = {
  state: ReturnType<typeof useSwiftUIState>;
  initialValue?: string;
}

type NativeSyncTextFieldProps = {
  initialValue: string;
  onStateInitialize: (event: StateInitializeEvent) => void;
}

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export function SyncTextField(props: SyncTextFieldProps) {
  const { state, initialValue = "" } = props;

  const onStateInitialize = (event: StateInitializeEvent) => {
    console.log('onStateInitialize', event.nativeEvent.stateId);
    state.stateId.current = event.nativeEvent.stateId;
  }

  return (
    <SyncTextFieldNativeView
      initialValue={initialValue}
      onStateInitialize={onStateInitialize}
    />
  );
}