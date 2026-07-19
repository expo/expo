import ExpoScreenOrientation from '../ExpoScreenOrientation';
import * as ScreenOrientation from '../ScreenOrientation';

it(`calls the lockPlatformAsync platform API with only iOS properties`, async () => {
  const androidProperties = {
    screenOrientationConstantAndroid: 1,
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

  expect(ExpoScreenOrientation.lockPlatformAsync).toHaveBeenCalledWith([]);
});

it(`throws when lockPlatformAsync is called with unsupported types in its iOS properties`, async () => {
  await expect(
    ScreenOrientation.lockPlatformAsync({ screenOrientationArrayIOS: 3 as any })
  ).rejects.toThrow(TypeError);
  await expect(
    ScreenOrientation.lockPlatformAsync({ screenOrientationArrayIOS: ['foo' as any] })
  ).rejects.toThrow(TypeError);
});
