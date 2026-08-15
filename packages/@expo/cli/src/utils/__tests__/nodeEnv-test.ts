import { vol } from 'memfs';

import { CommandError } from '../errors';
import { getConfigEnvMode, getEnvFiles, loadEnvFiles, reloadEnvFiles } from '../nodeEnv';

describe('Node environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.__EXPO_ENV_LOADED;
    delete process.env.EAS_BUILD;
    delete process.env.EXPO_CONFIG_MODE;
    delete process.env.EXPO_PUBLIC_VALUE;
    vol.reset();
  });

  afterAll(() => {
    process.env = originalEnv;
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

  it('uses production in EAS Build when EXPO_CONFIG_MODE is not set', () => {
    process.env.EAS_BUILD = 'true';

    expect(getConfigEnvMode()).toBe('production');
  });

  it('rejects an invalid EXPO_CONFIG_MODE value', () => {
    process.env.EXPO_CONFIG_MODE = 'staging';

    try {
      getConfigEnvMode();
      throw new Error('Expected getConfigEnvMode to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error).toMatchObject({
        code: 'BAD_ARGS',
        message: 'Invalid EXPO_CONFIG_MODE value: "staging". Use "development" or "production".',
      });
    }
    expect(process.env.EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('uses production mode when loading and reloading env files', () => {
    vol.fromJSON(
      {
        '.env.production': 'EXPO_PUBLIC_VALUE=production-v1',
        '.env.development': 'EXPO_PUBLIC_VALUE=development',
      },
      '/app'
    );
    (process.env as Record<string, string | undefined>).NODE_ENV = 'staging';
    const mode = 'production';
    loadEnvFiles('/app', { mode, silent: true });

    expect(process.env.NODE_ENV).toBe('production');
    expect(process.env.EXPO_PUBLIC_VALUE).toBe('production-v1');
    expect(getEnvFiles('/app', mode)).toContain('/app/.env.production');
    expect(getEnvFiles('/app', mode)).not.toContain('/app/.env.development');

    process.env.NODE_ENV = 'development';
    vol.writeFileSync('/app/.env.production', 'EXPO_PUBLIC_VALUE=production-v2');
    reloadEnvFiles('/app', mode);

    expect(process.env.NODE_ENV).toBe('production');
    expect(process.env.EXPO_PUBLIC_VALUE).toBe('production-v2');
  });
});
