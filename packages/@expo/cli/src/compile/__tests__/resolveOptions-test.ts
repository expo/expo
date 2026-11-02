import { resolveOptions } from '../resolveOptions';

describe(resolveOptions, () => {
  it.each([
    { platform: 'ios', mode: 'development', outputType: 'app' },
    { platform: 'ios', mode: 'production', outputType: 'ipa' },
    { platform: 'ios', mode: 'production', device: 'iPhone 18 Pro', outputType: 'app' },
    { platform: 'android', mode: 'production', outputType: 'aab' },
    { platform: 'android', mode: 'production', device: 'emulator-5554', outputType: 'apk' },
  ] as const)(
    `defaults --output-type to $outputType for $platform in $mode with device $device`,
    ({ platform, mode, device, outputType }) => {
      expect(resolveOptions('/app', { platform, mode, device })).toMatchObject({ outputType });
    }
  );

  it(`rejects an unknown --output-type`, () => {
    expect(() =>
      resolveOptions('/app', { platform: 'ios', mode: 'development', outputType: 'exe' })
    ).toThrow('Invalid option: --output-type exe. Valid options are: app, ipa');
  });
});
