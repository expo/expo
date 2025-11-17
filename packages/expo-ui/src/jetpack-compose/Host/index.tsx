import { requireNativeView } from 'expo';
import { Platform, StyleProp, ViewStyle } from 'react-native';

import { PrimitiveBaseProps } from '../layout';

//#region Host Component
export type HostProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
const HostNativeView: React.ComponentType<PrimitiveBaseProps> | null =
  Platform.OS === 'android' ? requireNativeView('ExpoUI', 'HostView') : null;
export function Host(props: HostProps) {
  if (!HostNativeView) {
    return null;
  }
  return (
    <HostNativeView
      {...props}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
//#endregion
