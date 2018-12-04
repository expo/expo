import { NativeModulesProxy } from 'expo-core';

import { mockPlatformIOS } from '../../test/mocking';
import DeviceMotion, { Gravity } from '../DeviceMotion';

afterEach(() => {
  DeviceMotion.removeAllListeners();
});

it(`adds an "deviceMotionDidUpdate" listener on iOS`, () => {
  mockPlatformIOS();
  const NativeDeviceMotion = NativeModulesProxy.ExponentDeviceMotion;

  const mockListener = jest.fn();
  const subscription = DeviceMotion.addListener(mockListener);

  expect(NativeDeviceMotion.addListener).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.addListener).toHaveBeenCalledWith('deviceMotionDidUpdate');

  subscription.remove();
  expect(NativeDeviceMotion.removeListeners).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.removeListeners).toHaveBeenCalledWith(1);
});

it(`notifies listeners`, () => {
  mockPlatformIOS();
  const mockListener = jest.fn();
  DeviceMotion.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
  DeviceMotion._nativeEmitter.emit('deviceMotionDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});

it(`sets the update interval`, async () => {
  const NativeDeviceMotion = NativeModulesProxy.ExponentDeviceMotion;
  await DeviceMotion.setUpdateInterval(1234);
  expect(NativeDeviceMotion.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.setUpdateInterval).toHaveBeenCalledWith(1234);
});

it(`exports a gravity constant`, () => {
  expect(Gravity).toBeCloseTo(9.80665);
  expect(DeviceMotion.Gravity).toBe(Gravity);
});
