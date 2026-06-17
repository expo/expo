import { validateConfig } from '../pluginConfig';
import { resolveDefaultLaunchURL } from '../withDevLauncher';

describe(resolveDefaultLaunchURL, () => {
  const emptyEnv: NodeJS.ProcessEnv = {};

  it(`returns undefined when nothing is configured`, () => {
    expect(resolveDefaultLaunchURL({}, 'ios', emptyEnv)).toBeUndefined();
    expect(resolveDefaultLaunchURL({}, 'android', emptyEnv)).toBeUndefined();
  });

  it(`uses the top-level value for both platforms`, () => {
    const props = { defaultLaunchURL: 'http://localhost:8081' };
    expect(resolveDefaultLaunchURL(props, 'ios', emptyEnv)).toBe('http://localhost:8081');
    expect(resolveDefaultLaunchURL(props, 'android', emptyEnv)).toBe('http://localhost:8081');
  });

  it(`prefers the platform-specific value over the top-level one`, () => {
    const props = {
      defaultLaunchURL: 'http://localhost:8081',
      ios: { defaultLaunchURL: 'http://localhost:8082' },
    };
    expect(resolveDefaultLaunchURL(props, 'ios', emptyEnv)).toBe('http://localhost:8082');
    // android has no override, so it falls back to the top-level value
    expect(resolveDefaultLaunchURL(props, 'android', emptyEnv)).toBe('http://localhost:8081');
  });

  it(`lets the EXPO_DEV_LAUNCHER_DEFAULT_LAUNCH_URL env var override everything`, () => {
    const props = {
      defaultLaunchURL: 'http://localhost:8081',
      ios: { defaultLaunchURL: 'http://localhost:8082' },
    };
    const env = { EXPO_DEV_LAUNCHER_DEFAULT_LAUNCH_URL: 'http://10.0.0.2:9000' };
    expect(resolveDefaultLaunchURL(props, 'ios', env)).toBe('http://10.0.0.2:9000');
    expect(resolveDefaultLaunchURL(props, 'android', env)).toBe('http://10.0.0.2:9000');
  });
});

describe(validateConfig, () => {
  it(`accepts a defaultLaunchURL string (top-level and per-platform)`, () => {
    expect(() => validateConfig({ defaultLaunchURL: 'http://localhost:8081' })).not.toThrow();
    expect(() =>
      validateConfig({ ios: { defaultLaunchURL: 'http://localhost:8082' } })
    ).not.toThrow();
    expect(() =>
      validateConfig({ android: { defaultLaunchURL: 'http://localhost:8083' } })
    ).not.toThrow();
  });

  it(`rejects a non-string defaultLaunchURL`, () => {
    // @ts-expect-error intentionally invalid type
    expect(() => validateConfig({ defaultLaunchURL: 8081 })).toThrow();
  });
});
