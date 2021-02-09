import ExponentGyroscope from '../ExponentGyroscope';
import Gyroscope from '../Gyroscope';

afterEach(() => {
  Gyroscope.removeAllListeners();
});

it(`adds an "gyroscopeDidUpdate" listener`, () => {
  const NativeGyroscope = ExponentGyroscope;

  const mockListener = jest.fn();
  const subscription = Gyroscope.addListener(mockListener);

  expect(NativeGyroscope.addListener).toHaveBeenCalledTimes(1);
  expect(NativeGyroscope.addListener).toHaveBeenCalledWith('gyroscopeDidUpdate');

  subscription.remove();
  expect(NativeGyroscope.removeListeners).toHaveBeenCalledTimes(1);
  expect(NativeGyroscope.removeListeners).toHaveBeenCalledWith(1);
});

it(`notifies listeners`, () => {
  const mockListener = jest.fn();
  Gyroscope.addListener(mockListener);

  const mockEvent = { x: 0.2, y: 0.1, z: 0.3 };
  Gyroscope._nativeEmitter.emit('gyroscopeDidUpdate', mockEvent);
  expect(mockListener).toHaveBeenCalledWith(mockEvent);
});
