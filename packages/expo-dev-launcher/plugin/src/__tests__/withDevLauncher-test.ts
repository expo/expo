import { validateConfig } from '../pluginConfig';
import { resolveDefaultServerUrl } from '../withDevLauncher';

describe(resolveDefaultServerUrl, () => {
  const emptyEnv: NodeJS.ProcessEnv = {};

  it(`returns undefined when nothing is configured`, () => {
    expect(resolveDefaultServerUrl({}, 'ios', emptyEnv)).toBeUndefined();
    expect(resolveDefaultServerUrl({}, 'android', emptyEnv)).toBeUndefined();
  });

  it(`uses the top-level value for both platforms`, () => {
    const props = { defaultServerUrl: 'http://192.168.1.50:8081' };
    expect(resolveDefaultServerUrl(props, 'ios', emptyEnv)).toBe('http://192.168.1.50:8081');
    expect(resolveDefaultServerUrl(props, 'android', emptyEnv)).toBe('http://192.168.1.50:8081');
  });

  it(`prefers the platform-specific value over the top-level one`, () => {
    const props = {
      defaultServerUrl: 'http://192.168.1.50:8081',
      ios: { defaultServerUrl: 'http://192.168.1.50:8082' },
    };
    expect(resolveDefaultServerUrl(props, 'ios', emptyEnv)).toBe('http://192.168.1.50:8082');
    // android has no override, so it falls back to the top-level value
    expect(resolveDefaultServerUrl(props, 'android', emptyEnv)).toBe('http://192.168.1.50:8081');
  });

  it(`lets the env var override everything`, () => {
    const props = {
      defaultServerUrl: 'http://192.168.1.50:8081',
      ios: { defaultServerUrl: 'http://192.168.1.50:8082' },
    };
    const env = { EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL: 'http://10.0.0.2:9000' };
    expect(resolveDefaultServerUrl(props, 'ios', env)).toBe('http://10.0.0.2:9000');
    expect(resolveDefaultServerUrl(props, 'android', env)).toBe('http://10.0.0.2:9000');
  });
});

describe(validateConfig, () => {
  it(`accepts a defaultServerUrl string`, () => {
    expect(() => validateConfig({ defaultServerUrl: 'http://192.168.1.50:8081' })).not.toThrow();
    expect(() =>
      validateConfig({ ios: { defaultServerUrl: 'http://192.168.1.50:8082' } })
    ).not.toThrow();
  });

  it(`rejects a non-string defaultServerUrl`, () => {
    // @ts-expect-error intentionally invalid type
    expect(() => validateConfig({ defaultServerUrl: 8081 })).toThrow();
  });
});
