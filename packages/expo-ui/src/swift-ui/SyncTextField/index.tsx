import "react-native-reanimated";
import {installOnUIRuntime, requireNativeView} from 'expo';
import  { requireNativeModule } from 'expo';

installOnUIRuntime();

const ExpoUI = requireNativeModule('ExpoUI');
ExpoUI.initializeWorkletFunctions();
type SyncTextFieldProps = {
  stateId: number;
}

const SyncTextFieldNativeView: React.ComponentType<SyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);


export function SyncTextField(props: SyncTextFieldProps) {
  return (
    <SyncTextFieldNativeView {...props} />
  );
}