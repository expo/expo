import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveOptionsAsync } from '../resolveOptions';

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it.each([
    { mode: 'development', variant: 'debug' },
    { mode: 'production', variant: 'release' },
  ] as const)(`resolves the $variant variant for $mode`, async ({ mode, variant }) => {
    vol.fromJSON(rnFixture, '/app');

    expect(await resolveOptionsAsync('/app', { mode, outputType: 'apk' })).toEqual({
      mode,
      outputType: 'apk',
      variant,
    });
  });

  it(`rejects --device`, async () => {
    await expect(
      resolveOptionsAsync('/app', {
        mode: 'development',
        device: 'emulator-5554',
        outputType: 'apk',
      })
    ).rejects.toThrow(
      'Device builds are not supported yet. Omit --device to build for all architectures.'
    );
  });

  it(`rejects an output type other than apk`, async () => {
    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'aab' })
    ).rejects.toThrow('Building an aab is not supported yet. Omit --output-type to build an apk.');
  });

  it(`rejects a missing android project`, async () => {
    vol.fromJSON({ 'package.json': '{}' }, '/app');

    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'apk' })
    ).rejects.toThrow(
      'Android project not found in project: /app. You can generate a project with `npx expo prebuild`'
    );
  });

  it(`rejects a malformed android project`, async () => {
    vol.fromJSON({ 'android/build.gradle': '' }, '/app');

    await expect(
      resolveOptionsAsync('/app', { mode: 'development', outputType: 'apk' })
    ).rejects.toThrow(
      'The android project is malformed. You can regenerate it with `npx expo prebuild`'
    );
  });
});
