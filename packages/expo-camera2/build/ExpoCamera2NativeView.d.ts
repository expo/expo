import * as React from 'react';
import { ViewProps } from 'react-native';
import { Autofocus, Facing, FlashMode, MountError, WhiteBalance } from './ExpoCamera2.types';
interface ExpoCamera2NativeViewProps extends ViewProps {
    autofocus?: Autofocus;
    facing?: Facing;
    flashMode?: FlashMode;
    focusDepth?: number;
    whiteBalance?: WhiteBalance;
    zoom?: number;
    onCameraReady?: () => void;
    onMountError?: (error: MountError) => void;
}
declare const ExpoCamera2NativeView: React.ComponentClass<ExpoCamera2NativeViewProps>;
export default ExpoCamera2NativeView;
