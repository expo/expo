import Accelerometer from '../Accelerometer';

afterEach(() => {
  Accelerometer.removeAllListeners();
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  Accelerometer.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3, timestamp: 123456 };
  Accelerometer._nativeModule.emit('accelerometerDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
