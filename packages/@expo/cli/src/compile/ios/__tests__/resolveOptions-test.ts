import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveOptionsAsync } from '../resolveOptions';

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it.each([
    { mode: 'development', configuration: 'Debug' },
    { mode: 'production', configuration: 'Release' },
  ] as const)(
    `resolves the $configuration configuration for $mode`,
    async ({ mode, configuration }) => {
      vol.fromJSON(rnFixture, '/app');

      expect(await resolveOptionsAsync('/app', { mode, outputType: 'app' })).toEqual({
        mode,
        outputType: 'app',
        configuration,
        xcodeProject: { name: '/app/ios/ReactNativeProject.xcodeproj', isWorkspace: false },
        scheme: 'ReactNativeProject',
        osType: 'iOS',
      });
    }
  );

  it(`rejects --device`, async () => {
    await expect(
      resolveOptionsAsync('/app', {
        mode: 'development',
        device: 'iPhone 18 Pro',
        outputType: 'app',
      })
    ).rejects.toThrow(
      'Device builds are not supported yet. Omit --device to build for the simulator.'
    );
  });

  it(`rejects an output type other than app`, async () => {
    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'ipa' })
    ).rejects.toThrow('Building an ipa is not supported yet. Omit --output-type to build an app.');
  });

  it(`rejects a non-iOS app`, async () => {
    const pbxprojPath = 'ios/ReactNativeProject.xcodeproj/project.pbxproj';
    vol.fromJSON(
      {
        ...rnFixture,
        [pbxprojPath]: rnFixture[pbxprojPath].replace(
          /PRODUCT_NAME = ReactNativeProject;/g,
          'PRODUCT_NAME = ReactNativeProject; SDKROOT = appletvos;'
        ),
      },
      '/app'
    );

    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'app' })
    ).rejects.toThrow(
      'The ReactNativeProject scheme builds a tvOS app. compile:ios only supports iOS apps for now. Use `npx expo run:ios` to build it.'
    );
  });

  it(`rejects a malformed ios project`, async () => {
    vol.fromJSON({ 'ios/App.xcodeproj': null }, '/app');

    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'app' })
    ).rejects.toThrow(
      'The ios project is malformed. You can regenerate it with `npx expo prebuild`'
    );
  });
});
