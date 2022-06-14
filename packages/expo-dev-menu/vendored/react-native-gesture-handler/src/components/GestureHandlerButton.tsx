import { HostComponent, requireNativeComponent } from 'react-native';
import { RawButtonProps } from './GestureButtons';
const RNGestureHandlerButton: HostComponent<RawButtonProps> = requireNativeComponent(
  'RNGestureHandlerButton'
);

export default RNGestureHandlerButton;
