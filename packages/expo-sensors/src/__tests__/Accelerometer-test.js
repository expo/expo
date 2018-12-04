import { NativeModulesProxy } from 'expo-core';

import { mockPlatformIOS } from '../../test/mocking';
import Accelerometer from '../Accelerometer';

afterEach(() => {
  Accelerometer.removeAllListeners();
});

it(`adds an "accelerometerDidUpdate" listener on iOS`, () => {
  mockPlatformIOS();
  const NativeAccelerometer = NativeModulesProxy.ExponentAccelerometer;

  const mockListener = jest.fn();
  const subscription = Accelerometer.addListener(mockListener);

  expect(NativeAccelerometer.addListener).toHaveBeenCalledTimes(1);
  expect(NativeAccelerometer.addListener).toHaveBeenCalledWith('accelerometerDidUpdate');

  subscription.remove();
  expect(NativeAccelerometer.removeListeners).toHaveBeenCalledTimes(1);
  expect(NativeAccelerometer.removeListeners).toHaveBeenCalledWith(1);
});

it(`notifies listeners`, () => {
  mockPlatformIOS();
  const mockListener = jest.fn();
  Accelerometer.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
  Accelerometer._nativeEmitter.emit('accelerometerDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});

it(`sets the update interval`, async () => {
  const NativeAccelerometer = NativeModulesProxy.ExponentAccelerometer;
  await Accelerometer.setUpdateInterval(1234);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledWith(1234);
});
