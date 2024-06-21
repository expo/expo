import DeviceMotion from '../DeviceMotion';

afterEach(() => {
  DeviceMotion.removeAllListeners();
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  DeviceMotion.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3, timestamp: 123456 };
  DeviceMotion._nativeModule.emit('deviceMotionDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
