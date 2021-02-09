import DeviceMotion, { Gravity } from '../DeviceMotion';
import ExponentDeviceMotion from '../ExponentDeviceMotion';

afterEach(() => {
  DeviceMotion.removeAllListeners();
});

it(`sets the update interval`, async () => {
  const NativeDeviceMotion = ExponentDeviceMotion;
  await DeviceMotion.setUpdateInterval(1234);
  expect(NativeDeviceMotion.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeDeviceMotion.setUpdateInterval).toHaveBeenCalledWith(1234);
});

it(`exports a gravity constant`, () => {
  expect(Gravity).toBeCloseTo(9.80665);
  expect(DeviceMotion.Gravity).toBe(Gravity);
});
