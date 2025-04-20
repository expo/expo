import { Platform } from 'expo-modules-core';

import Magnetometer from '../Magnetometer';
import MagnetometerUncalibrated from '../MagnetometerUncalibrated';

describe(
  'Magnetometer',
  declareMagnetometerSpecs(Magnetometer, {
    magnetometerDidUpdate: 'magnetometerDidUpdate',
  })
);

describe(
  'MagnetometerUncalibrated',
  declareMagnetometerSpecs(MagnetometerUncalibrated, {
    magnetometerDidUpdate: 'magnetometerUncalibratedDidUpdate',
  })
);

function declareMagnetometerSpecs(
  MagnetometerMod: typeof Magnetometer | typeof MagnetometerUncalibrated,
  eventNames: Record<string, string>
) {
  return () => {
    afterEach(() => {
      MagnetometerMod.removeAllListeners();
    });

    if (Platform.OS === 'ios') {
      it(`notifies listeners`, () => {
        const mockListener = jest.fn();
        MagnetometerMod.addListener(mockListener);

        const mockEvent = { x: 0.2, y: 0.1, z: 0.3, timestamp: 123456 };
        MagnetometerMod._nativeModule.emit(eventNames.magnetometerDidUpdate, mockEvent);
        expect(mockListener).toHaveBeenCalledWith(mockEvent);
      });
    }

    it(`sets the update interval`, async () => {
      await MagnetometerMod.setUpdateInterval(1234);
      const NativeMagnetometer = MagnetometerMod._nativeModule;
      expect(NativeMagnetometer.setUpdateInterval).toHaveBeenCalledTimes(1);
      expect(NativeMagnetometer.setUpdateInterval).toHaveBeenCalledWith(1234);
    });
  };
}
