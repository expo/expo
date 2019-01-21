import { requireNativeViewManager } from 'expo-core';
import * as React from 'react';
import { NativeProps } from './Video.types';
type ExponentVideo = React.ComponentClass<NativeProps>;
const ExponentVideo = requireNativeViewManager('ExpoVideoView');
export default ExponentVideo;
