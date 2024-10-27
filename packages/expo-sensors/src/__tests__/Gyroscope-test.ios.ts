import Gyroscope from '../Gyroscope';

afterEach(() => {
  Gyroscope.removeAllListeners();
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  Gyroscope.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3, timestamp: 123456 };
  Gyroscope._nativeModule.emit('gyroscopeDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
