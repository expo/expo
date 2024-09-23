import ExpoScreenOrientation from '../ExpoScreenOrientation';
import * as ScreenOrientation from '../ScreenOrientation';

it(`calls the lockPlatformAsync platform API with only Android properties`, async () => {
  const screenOrientationConstantAndroid = 1;
  const androidProperties = {
    screenOrientationConstantAndroid,
  };
  const iOSProperties = {
    screenOrientationArrayIOS: [],
  };
  const badProperties = {
    bad: 'shouldnt be here',
  };

  await ScreenOrientation.lockPlatformAsync({
    ...androidProperties,
    ...iOSProperties,
    ...badProperties,
  });

  expect(ExpoScreenOrientation.lockPlatformAsync).toBeCalledWith(screenOrientationConstantAndroid);
});

it(`throws when lockPlatformAsync is called with unsupported types in its Android properties`, async () => {
  await expect(
    ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: NaN as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: 'test' as any })
  ).rejects.toThrowError(TypeError);
});
