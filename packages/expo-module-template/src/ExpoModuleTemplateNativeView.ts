import { requireNativeViewManager } from 'expo-modules-core';

type NativeViewProps = {
  someGreatProp: number;
};

const NativeView: React.ComponentType<NativeViewProps> =
  requireNativeViewManager('ExpoModuleTemplate');

export default NativeView;
