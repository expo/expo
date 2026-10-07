import { resolveOptions } from '../resolveOptions';

describe(resolveOptions, () => {
  it.each([
    { mode: 'development', configuration: 'Debug' },
    { mode: 'production', configuration: 'Release' },
  ] as const)(`resolves the $configuration configuration for $mode`, ({ mode, configuration }) => {
    expect(resolveOptions('/app', { mode, outputType: 'app' })).toEqual({
      mode,
      outputType: 'app',
      configuration,
    });
  });

  it(`rejects --device`, () => {
    expect(() =>
      resolveOptions('/app', { mode: 'development', device: 'iPhone 18 Pro', outputType: 'app' })
    ).toThrow('Device builds are not supported yet. Omit --device to build for the simulator.');
  });

  it(`rejects an output type other than app`, () => {
    expect(() => resolveOptions('/app', { mode: 'development', outputType: 'ipa' })).toThrow(
      'Building an ipa is not supported yet. Omit --output-type to build an app.'
    );
  });
});
