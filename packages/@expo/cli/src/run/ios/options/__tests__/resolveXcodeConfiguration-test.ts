import { resolveXcodeConfigurationMode } from '../resolveXcodeConfiguration';

describe(resolveXcodeConfigurationMode, () => {
  it('defaults to development mode', () => {
    expect(resolveXcodeConfigurationMode()).toBe('development');
  });

  it.each(['Debug', 'debug', 'DebugStaging', 'StagingDebug'])(
    'uses development mode for %s',
    (configuration) => {
      expect(resolveXcodeConfigurationMode(configuration)).toBe('development');
    }
  );

  it.each(['Release', 'StagingRelease', 'ReleaseStaging', 'Staging'])(
    'uses production mode for %s',
    (configuration) => {
      expect(resolveXcodeConfigurationMode(configuration)).toBe('production');
    }
  );
});
