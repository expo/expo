import * as React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
import { ViewProps } from 'react-native'
import {
  Autofocus,
  Facing,
  FlashMode,
  MountError,
  WhiteBalance,
} from './ExpoCamera2.types';

// TODO: to be removed
import ExpoCamera2NativeViewPlaceholder from './ExpoCamera2NativeViewPlaceholder';

interface ExpoCamera2NativeViewProps extends ViewProps {
  // Configuration
  autofocus?: Autofocus;
  facing?: Facing;
  flashMode?: FlashMode;
  focusDepth?: number;
  whiteBalance?: WhiteBalance;
  zoom?: number;

  // Callbacks
  onCameraReady?: () => void;
  onMountError?: (error: MountError) => void;
}

// TODO: to be restored
// const ExpoCamera2NativeView: React.ComponentClass<ExpoCamera2NativeViewProps> = requireNativeViewManager<ExpoCamera2NativeViewProps>('ExpoCamera2View') as React.ComponentClass<ExpoCamera2NativeViewProps>;

// TODO: to be removed
// @ts-ignore
const ExpoCamera2NativeView: React.ComponentClass<ExpoCamera2NativeViewProps> = ExpoCamera2NativeViewPlaceholder;

export default ExpoCamera2NativeView;
