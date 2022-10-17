import DeviceMotion from '../DeviceMotion';

afterEach(() => {
  DeviceMotion.removeAllListeners();
});

it(`adds an "deviceMotionDidUpdate" listener`, () => {
  const NativeDeviceMotion = DeviceMotion._nativeModule;

  const mockListener = jest.fn();
  const subscription = DeviceMotion.addListener(mockListener);

  expect(NativeDeviceMotion.addListener).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.addListener).toHaveBeenCalledWith('deviceMotionDidUpdate');

  subscription.remove();
  expect(NativeDeviceMotion.removeListeners).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.removeListeners).toHaveBeenCalledWith(1);
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  DeviceMotion.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
  DeviceMotion._nativeEmitter.emit('deviceMotionDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
