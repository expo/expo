// @flow

import React from 'react';
import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { NativeModulesProxy } from 'expo-core';

const CameraManager: Object =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

type Data = {
  data: string,
  type: string,
};

type Props = {
  torchMode?: string | number,
  type?: string | number,
  onBarCodeRead: Data => void,
  barCodeTypes: string[],
};

export default class BarCodeScanner extends React.Component<Props> {
  static Constants = {
    ...Camera.Constants,
    TorchMode: {
      on: Camera.Constants.FlashMode.torch,
      off: Camera.Constants.FlashMode.off,
    },
  };

  static readFromURL(url: string, barCodeTypes: Array<string | number>) {
    if (
      Platform.OS === 'ios' &&
      barCodeTypes &&
      barCodeTypes.length > 0 &&
      !barCodeTypes.includes(BarCodeScanner.Constants.BarCodeType.qr)
    ) {
      // Only QR is supported on iOS, fail if one tries only to use other types
      throw new Error('Only QR is supported by readFromURL() on iOS');
    }

    return CameraManager.readBarCodeFromURL(url, barCodeTypes);
  }

  render() {
    const props: Props & { flashMode?: number } = { ...this.props };
    if (props.torchMode !== undefined) {
      if (typeof props.torchMode === 'string') {
        props.flashMode = BarCodeScanner.Constants.TorchMode[props.torchMode];
      } else {
        props.flashMode = props.torchMode;
      }
      delete props.torchMode;
    }
    return <Camera {...props} />;
  }
}

export const Constants = BarCodeScanner.Constants;
