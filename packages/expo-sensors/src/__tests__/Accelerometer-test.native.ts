import Accelerometer from '../Accelerometer';
import ExponentAccelerometer from '../ExponentAccelerometer';

afterEach(() => {
  Accelerometer.removeAllListeners();
});

it(`sets the update interval`, async () => {
  const NativeAccelerometer = ExponentAccelerometer;
  await Accelerometer.setUpdateInterval(1234);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeAccelerometer.setUpdateInterval).toHaveBeenCalledWith(1234);
});
