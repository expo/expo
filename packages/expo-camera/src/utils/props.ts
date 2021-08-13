import { Platform } from 'expo-modules-core';

import {
  CameraNativeProps,
  CameraType,
  FlashMode,
  AutoFocus,
  WhiteBalance,
  CameraProps,
} from '../Camera.types';
import CameraManager from '../ExponentCameraManager';

// Values under keys from this object will be transformed to native options
export const ConversionTables: {
  type: Record<keyof typeof CameraType, CameraNativeProps['type']>;
  flashMode: Record<keyof typeof FlashMode, CameraNativeProps['flashMode']>;
  autoFocus: Record<keyof typeof AutoFocus, CameraNativeProps['autoFocus']>;
  whiteBalance: Record<keyof typeof WhiteBalance, CameraNativeProps['whiteBalance']>;
} = {
  type: CameraManager.Type,
  flashMode: CameraManager.FlashMode,
  autoFocus: CameraManager.AutoFocus,
  whiteBalance: CameraManager.WhiteBalance,
};

export function convertNativeProps(props?: CameraProps): CameraNativeProps {
  if (!props || typeof props !== 'object') {
    return {};
  }

  const nativeProps: CameraNativeProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && ConversionTables[key]) {
      nativeProps[key] = ConversionTables[key][value];
    } else {
      nativeProps[key] = value;
    }
  }

  return nativeProps;
}

export function ensureNativeProps(props?: CameraProps): CameraNativeProps {
  const newProps = convertNativeProps(props);

  if (newProps.onBarCodeScanned) {
    newProps.barCodeScannerEnabled = true;
  }

  if (newProps.onFacesDetected) {
    newProps.faceDetectorEnabled = true;
  }

  if (Platform.OS !== 'android') {
    delete newProps.ratio;
    delete newProps.useCamera2Api;
  }

  if (Platform.OS !== 'web') {
    delete newProps.poster;
  }

  return newProps;
}
