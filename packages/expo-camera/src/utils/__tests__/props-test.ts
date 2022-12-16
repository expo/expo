import { BarCodeScanner } from 'expo-barcode-scanner';
import { Platform } from 'react-native';

import { AutoFocus, CameraType, FlashMode, WhiteBalance } from '../../Camera.types';
import { ensureNativeProps } from '../props';

describe(ensureNativeProps, () => {
  it(`processes platform props`, () => {
    const onBarCodeScanned = () => {};
    const onFacesDetected = () => {};

    expect(
      ensureNativeProps({
        type: CameraType.front,
        flashMode: FlashMode.torch,
        autoFocus: AutoFocus.auto,
        whiteBalance: WhiteBalance.continuous,
        poster: './image.png',
        ratio: '1080p',
        useCamera2Api: true,
        barCodeScannerSettings: {
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        },
        onBarCodeScanned,
        onFacesDetected,
      })
    ).toStrictEqual(
      Platform.select({
        ios: {
          // Native module not defined
          autoFocus: undefined,
          type: undefined,
          whiteBalance: undefined,
          flashMode: undefined,
          barCodeScannerSettings: {
            barCodeTypes: [undefined],
          },
          onBarCodeScanned,
          onFacesDetected,
          barCodeScannerEnabled: true,
          faceDetectorEnabled: true,
        },
        android: {
          // Native module not defined
          autoFocus: undefined,
          type: undefined,
          whiteBalance: undefined,
          flashMode: undefined,
          barCodeScannerSettings: {
            barCodeTypes: [undefined],
          },
          onBarCodeScanned,
          onFacesDetected,
          barCodeScannerEnabled: true,
          faceDetectorEnabled: true,
          // Android only
          ratio: '1080p',
          useCamera2Api: true,
        },
        // Web and node
        default: {
          autoFocus: 'auto',
          flashMode: 'torch',
          type: 'front',
          whiteBalance: 'continuous',
          barCodeScannerSettings: {
            barCodeTypes: ['qr'],
          },
          onBarCodeScanned,
          onFacesDetected,
          barCodeScannerEnabled: true,
          faceDetectorEnabled: true,
          // Web only
          poster: './image.png',
        },
      })
    );
  });
});
