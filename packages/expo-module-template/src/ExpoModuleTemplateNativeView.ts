import { requireNativeViewManager } from 'expo-modules-core';

type NativeViewProps = object;

const NativeView: React.ComponentType<NativeViewProps> =
  requireNativeViewManager('ExpoModuleTemplate');

export default NativeView;
