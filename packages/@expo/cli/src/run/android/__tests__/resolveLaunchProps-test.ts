import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveLaunchPropsAsync } from '../resolveLaunchProps';

describe(resolveLaunchPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`throws when /android folder is missing`, async () => {
    vol.fromJSON({}, '/');
    await expect(resolveLaunchPropsAsync('/', {})).rejects.toThrow(
      /Android project folder is missing in project/
    );
  });

  it(`resolves standard launch properties`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(await resolveLaunchPropsAsync('/', {})).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: undefined,
    });
  });

  it(`resolves standard launch properties manual but identical app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(
      await resolveLaunchPropsAsync('/', { appId: 'com.bacon.mydevicefamilyproject' })
    ).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'com.bacon.mydevicefamilyproject',
    });
  });

  // See: https://developer.android.com/build/build-variants#change-app-id
  it(`resolves launch properties with custom suffixed app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(
      await resolveLaunchPropsAsync('/', { appId: 'com.bacon.mydevicefamilyproject.free' })
    ).toEqual({
      launchActivity:
        'com.bacon.mydevicefamilyproject.free/com.bacon.mydevicefamilyproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'com.bacon.mydevicefamilyproject.free',
    });
  });

  it(`resolves launch properties with fully custom app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(await resolveLaunchPropsAsync('/', { appId: 'dev.expo.test' })).toEqual({
      launchActivity: 'dev.expo.test/com.bacon.mydevicefamilyproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'dev.expo.test',
    });
  });
});
