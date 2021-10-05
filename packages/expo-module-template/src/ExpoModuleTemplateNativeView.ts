import { requireNativeViewManager } from 'expo-modules-core';

type NativeViewProps = object;

const NativeView: React.ComponentType<NativeViewProps> =
  requireNativeViewManager('ExpoModuleTemplateView');

export default NativeView;
