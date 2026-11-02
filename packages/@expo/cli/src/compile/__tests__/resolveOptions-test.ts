import { vol } from 'memfs';

import { resolveOptions, resolveOutputDir } from '../resolveOptions';

afterEach(() => vol.reset());

describe(resolveOptions, () => {
  it(`rejects an unknown --output-type`, () => {
    expect(() => resolveOptions('ios', { dev: true, 'output-type': 'exe' })).toThrow(
      'Invalid option: --output-type exe. Valid options are: app, ipa'
    );
  });

  it.each([
    { platform: 'ios', target: 'the simulator' },
    { platform: 'android', target: 'all architectures' },
  ] as const)(`rejects --device for $platform`, ({ platform, target }) => {
    expect(() => resolveOptions(platform, { device: 'my-device' })).toThrow(
      `Device builds are not supported yet. Omit --device to build for ${target}.`
    );
  });
});

describe(resolveOutputDir, () => {
  it(`resolves a symlinked --output-dir to its real path`, () => {
    vol.fromJSON({ '/app/android/app/build/outputs/apk/debug/app-debug.apk': '' });
    vol.symlinkSync('/app/android/app/build/outputs/apk/debug', '/app/build');

    expect(resolveOutputDir('/app', 'build')).toBe('/app/android/app/build/outputs/apk/debug');
  });
});
