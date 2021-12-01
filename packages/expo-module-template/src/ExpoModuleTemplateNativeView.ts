import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

type NativeViewProps = {
  someGreatProp: number;
};

const NativeView: React.ComponentType<NativeViewProps> =
  requireNativeViewManager('ExpoModuleTemplate');

export default NativeView;
