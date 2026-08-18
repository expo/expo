import { getConfigEnvMode } from '../nodeEnv';

describe(getConfigEnvMode, () => {
  afterEach(() => {
    delete process.env.EAS_BUILD;
    delete process.env.__EXPO_CONFIG_MODE;
  });

  it('reads and removes __EXPO_CONFIG_MODE', () => {
    process.env.__EXPO_CONFIG_MODE = 'production';

    expect(getConfigEnvMode()).toBe('production');
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('uses development when __EXPO_CONFIG_MODE is not set', () => {
    expect(getConfigEnvMode()).toBe('development');
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('uses production in EAS Build when __EXPO_CONFIG_MODE is not set', () => {
    process.env.EAS_BUILD = 'true';

    expect(getConfigEnvMode()).toBe('production');
  });

  it('rejects an invalid __EXPO_CONFIG_MODE value', () => {
    process.env.__EXPO_CONFIG_MODE = 'staging';

    expect(() => getConfigEnvMode()).toThrow(
      'Invalid __EXPO_CONFIG_MODE value: "staging". Use "development" or "production".'
    );
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });
});
