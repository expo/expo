import Accelerometer from '../Accelerometer';

afterEach(() => {
  Accelerometer.removeAllListeners();
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  Accelerometer.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
  Accelerometer._nativeEmitter.emit('accelerometerDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
