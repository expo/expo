import { Platform } from 'expo-modules-core';

import { CameraNativeProps, CameraType, FlashMode, CameraViewProps } from '../Camera.types';
import CameraManager from '../ExpoCameraManager';

// Values under keys from this object will be transformed to native options
export const ConversionTables: {
  type: Record<keyof CameraType, CameraNativeProps['facing']>;
  flash: Record<keyof FlashMode, CameraNativeProps['flashMode']>;
  [prop: string]: unknown;
} = {
  type: CameraManager.Type,
  flash: CameraManager.FlashMode,
};

export function convertNativeProps(props?: CameraViewProps): CameraNativeProps {
  if (!props || typeof props !== 'object') {
    return {};
  }

  const nativeProps: CameraNativeProps = {};

  for (const [key, value] of Object.entries(props)) {
    const prop = key as 'type' | 'flash' | string;
    if (typeof value === 'string' && ConversionTables[prop]) {
      nativeProps[key as keyof CameraNativeProps] =
        ConversionTables[prop as 'type' | 'flash'][value as any];
    } else {
      nativeProps[key as keyof CameraNativeProps] = value;
    }
  }

  return nativeProps;
}

export function ensureNativeProps(props?: CameraViewProps): CameraNativeProps {
  const newProps = convertNativeProps(props);

  newProps.barcodeScannerEnabled = !!props?.onBarcodeScanned;
  newProps.flashMode = props?.flash ?? 'off';
  newProps.mute = props?.mute ?? false;
  newProps.autoFocus = props?.autofocus ?? 'off';

  if (Platform.OS !== 'web') {
    delete newProps.poster;
  }

  return newProps;
}
