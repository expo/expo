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

function declareMagnetometerSpecs(Magnetometer, eventNames) {
  return () => {
    afterEach(() => {
      Magnetometer.removeAllListeners();
    });

    if (Platform.OS === 'ios') {
      it(`adds an magnetometer update listener`, () => {
        const mockListener = jest.fn();
        const subscription = Magnetometer.addListener(mockListener);
        const NativeMagnetometer = Magnetometer._nativeModule;

        expect(NativeMagnetometer.addListener).toHaveBeenCalledTimes(1);
        expect(NativeMagnetometer.addListener).toHaveBeenCalledWith(
          eventNames.magnetometerDidUpdate
        );

        subscription.remove();
        expect(NativeMagnetometer.removeListeners).toHaveBeenCalledTimes(1);
        expect(NativeMagnetometer.removeListeners).toHaveBeenCalledWith(1);
      });

      it(`notifies listeners`, () => {
        const mockListener = jest.fn();
        Magnetometer.addListener(mockListener);

        const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
        Magnetometer._nativeEmitter.emit(eventNames.magnetometerDidUpdate, mockEvent);
        expect(mockListener).toHaveBeenCalledWith(mockEvent);
      });
    }

    it(`sets the update interval`, async () => {
      await Magnetometer.setUpdateInterval(1234);
      const NativeMagnetometer = Magnetometer._nativeModule;
      expect(NativeMagnetometer.setUpdateInterval).toHaveBeenCalledTimes(1);
      expect(NativeMagnetometer.setUpdateInterval).toHaveBeenCalledWith(1234);
    });
  };
}
