import { getConfigEnvMode } from '../utils/nodeEnv';

describe(getConfigEnvMode, () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.__EXPO_CONFIG_MODE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads and removes the mode passed by the parent process', () => {
    process.env.__EXPO_CONFIG_MODE = 'production';

    expect(getConfigEnvMode('development')).toBe('production');
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('uses the command default when no mode is passed', () => {
    expect(getConfigEnvMode('development')).toBe('development');
  });
});
