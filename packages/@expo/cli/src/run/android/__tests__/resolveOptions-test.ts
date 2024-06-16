import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveOptionsAsync } from '../resolveOptions';

jest.mock('../../../utils/port');

jest.mock('../resolveDevice', () => ({
  resolveDeviceAsync: jest.fn(async () => ({
    device: {
      name: 'mock',
      pid: '123',
    },
  })),
}));

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it(`resolves default options`, async () => {
    vol.fromJSON(rnFixture, '/');

    expect(await resolveOptionsAsync('/', {})).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/debug',
      appName: 'app',
      buildCache: false,
      buildType: 'debug',
      architectures: '',
      device: {
        device: {
          name: 'mock',
          pid: '123',
        },
      },
      flavors: [],
      install: false,
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      port: 8081,
      shouldStartBundler: true,
      variant: 'debug',
    });
  });
  it(`resolves complex options`, async () => {
    vol.fromJSON(rnFixture, '/');

    expect(
      await resolveOptionsAsync('/', {
        buildCache: true,
        bundler: true,
        device: 'search',
        install: true,
        port: 8081,
        variant: 'firstSecondThird',
      })
    ).toEqual({
      apkVariantDirectory: '/android/app/build/outputs/apk/second/third/first',
      appName: 'app',
      buildCache: true,
      buildType: 'first',
      architectures: '',
      device: {
        device: {
          name: 'mock',
          pid: '123',
        },
      },
      flavors: ['second', 'third'],
      install: true,
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      port: 8081,
      shouldStartBundler: true,
      variant: 'firstSecondThird',
    });
  });
});
