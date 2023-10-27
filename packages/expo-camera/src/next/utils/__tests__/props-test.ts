import { BarCodeScanner } from 'expo-barcode-scanner';
import { Platform } from 'react-native';

import { CameraType, FlashMode } from '../../Camera.types';
import { ensureNativeProps } from '../props';

describe(ensureNativeProps, () => {
  it(`processes platform props`, () => {
    const onBarCodeScanned = () => {};
    const onFacesDetected = () => {};

    expect(
      ensureNativeProps({
        type: CameraType.front,
        flashMode: FlashMode.off,
        poster: './image.png',
        barCodeScannerSettings: {
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        },
        onBarCodeScanned,
      })
    ).toStrictEqual(
      Platform.select({
        ios: {
          // Native module not defined
          type: undefined,
          flashMode: undefined,
          barCodeScannerSettings: {
            barCodeTypes: [undefined],
          },
          onBarCodeScanned,
          barCodeScannerEnabled: true,
        },
        android: {
          // Native module not defined
          type: undefined,
          flashMode: undefined,
          barCodeScannerSettings: {
            barCodeTypes: [undefined],
          },
          onBarCodeScanned,
          barCodeScannerEnabled: true,
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
