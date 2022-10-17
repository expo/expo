import Gyroscope from '../Gyroscope';

afterEach(() => {
  Gyroscope.removeAllListeners();
});

it(`sets the update interval`, async () => {
  const NativeGyroscope = Gyroscope._nativeModule;
  await Gyroscope.setUpdateInterval(1234);
  expect(NativeGyroscope.setUpdateInterval).toHaveBeenCalledTimes(1);
  expect(NativeGyroscope.setUpdateInterval).toHaveBeenCalledWith(1234);
});
