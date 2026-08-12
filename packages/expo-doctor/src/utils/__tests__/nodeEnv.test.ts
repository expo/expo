import { getConfigEnvMode } from '../nodeEnv';

describe(getConfigEnvMode, () => {
  afterEach(() => {
    delete process.env.EXPO_CONFIG_MODE;
  });

  it('reads and removes EXPO_CONFIG_MODE', () => {
    process.env.EXPO_CONFIG_MODE = 'production';

    expect(getConfigEnvMode()).toBe('production');
    expect(process.env.EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('uses development when EXPO_CONFIG_MODE is not set', () => {
    expect(getConfigEnvMode()).toBe('development');
    expect(process.env.EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('rejects an invalid EXPO_CONFIG_MODE value', () => {
    process.env.EXPO_CONFIG_MODE = 'staging';

    expect(() => getConfigEnvMode()).toThrow(
      'Invalid EXPO_CONFIG_MODE value: "staging". Use "development" or "production".'
    );
    expect(process.env.EXPO_CONFIG_MODE).toBeUndefined();
  });
});
