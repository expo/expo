import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

export type BottomSheetProps = {
  children?: React.ReactNode;
};

// We have to work around the `role` and `onPress` props being reserved by React Native.
export type NativeBottomSheetProps = BottomSheetProps & {};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

export function BottomSheet(props: BottomSheetProps) {
  // Min height from https://m3.material.io/components/buttons/specs, minWidth
  return <BottomSheetNativeView {...props} />;
}
