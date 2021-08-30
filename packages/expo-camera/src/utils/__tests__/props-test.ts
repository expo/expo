import { Platform } from 'react-native';

import { ensureNativeProps } from '../props';

describe(ensureNativeProps, () => {
  it(`processes platform props`, () => {
    const onBarCodeScanned = () => {};
    const onFacesDetected = () => {};

    expect(
      ensureNativeProps({
        type: 'front',
        flashMode: 'torch',
        autoFocus: 'auto',
        whiteBalance: 'continuous',
        poster: './image.png',
        ratio: '1080p',
        useCamera2Api: true,
        barCodeScannerSettings: {},
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
          barCodeScannerSettings: {},
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
          barCodeScannerSettings: {},
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
          barCodeScannerSettings: {},
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
