import { getConfigEnvMode } from '../nodeEnv';

describe(getConfigEnvMode, () => {
  afterEach(() => {
    delete process.env.EAS_BUILD;
    delete process.env.__EXPO_CONFIG_MODE;
  });

  it('uses development outside EAS Build when __EXPO_CONFIG_MODE is not set', () => {
    delete process.env.EAS_BUILD;
    delete process.env.__EXPO_CONFIG_MODE;

    expect(getConfigEnvMode()).toBe('development');
  });

  it('uses production in EAS Build when __EXPO_CONFIG_MODE is not set', () => {
    delete process.env.__EXPO_CONFIG_MODE;
    process.env.EAS_BUILD = 'true';

    expect(getConfigEnvMode()).toBe('production');
  });
});
