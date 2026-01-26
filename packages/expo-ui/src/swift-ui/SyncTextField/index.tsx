import "react-native-reanimated";
import { NativeSyntheticEvent } from "react-native";
import { installOnUIRuntime, requireNativeView } from 'expo';
import { requireNativeModule } from 'expo';
import { useSwiftUIState } from "../SwiftUIState";

installOnUIRuntime();

const ExpoUI = requireNativeModule('ExpoUI');
ExpoUI.initializeWorkletFunctions();

type StateInitializeEvent = NativeSyntheticEvent<{ stateId: number }>;

type NativeSyncTextFieldProps = {
  initialValue: string;
  onStateInitialize: (event: StateInitializeEvent) => void;
}

type SyncTextFieldProps = {
  state: ReturnType<typeof useSwiftUIState<NativeSyncTextFieldProps['initialValue']>>;
}

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export function SyncTextField(props: SyncTextFieldProps) {
  const { state } = props;

  const onStateInitialize = (event: StateInitializeEvent) => {
    state.setStateId(event.nativeEvent.stateId);
  }

  return (
    <SyncTextFieldNativeView
      initialValue={state.initialValue}
      onStateInitialize={onStateInitialize}
    />
  );
}