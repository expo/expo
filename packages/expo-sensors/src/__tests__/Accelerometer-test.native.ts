import Accelerometer from '../Accelerometer';

afterEach(() => {
  Accelerometer.removeAllListeners();
});

it(`sets the update interval`, async () => {
  const NativeAccelerometer = Accelerometer._nativeModule;
  await Accelerometer.setUpdateInterval(1234);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledWith(1234);
});
