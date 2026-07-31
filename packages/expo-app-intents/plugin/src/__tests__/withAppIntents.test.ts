import { WarningAggregator } from 'expo/config-plugins';

import withAppIntents, { withAppIntentsValidation } from '../withAppIntents';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

const baseConfig = { name: 'test-app', slug: 'test-app' } as any;

function configWatching(...watchedDirectories: string[]) {
  return {
    ...baseConfig,
    experiments: { inlineModules: { watchedDirectories } },
  };
}

describe(withAppIntentsValidation, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws an actionable error when inline modules are not configured', () => {
    expect(() => withAppIntentsValidation(baseConfig, { directory: 'app-intents' })).toThrow(
      /experiments\.inlineModules/
    );
  });

  it('throws when the intents directory is not watched', () => {
    const config = configWatching('other');
    expect(() => withAppIntentsValidation(config, { directory: 'app-intents' })).toThrow(
      /app-intents/
    );
  });

  it('throws when a watched directory only shares a prefix with the intents directory', () => {
    const config = configWatching('app-intents-extra');
    expect(() => withAppIntentsValidation(config, { directory: 'app-intents' })).toThrow(
      /app-intents/
    );
  });

  it('names the plugin directory prop as the other way out', () => {
    const config = configWatching('ios-modules');
    expect(() => withAppIntentsValidation(config, { directory: 'app-intents' })).toThrow(
      /"directory"/
    );
  });

  it('passes config through when configured correctly', () => {
    const config = configWatching('app-intents');
    expect(withAppIntentsValidation(config, { directory: 'app-intents' })).toBe(config);
  });

  // `expo-modules-autolinking` resolves each watched entry against the app root, so these all
  // name the same directory as `app-intents`.
  it.each(['./app-intents', 'app-intents/', './app-intents/', 'app-intents/../app-intents'])(
    'accepts the equivalent watched path %s',
    (watchedDirectory) => {
      const config = configWatching(watchedDirectory);
      expect(withAppIntentsValidation(config, { directory: 'app-intents' })).toBe(config);
    }
  );

  // Watched directories are scanned recursively, so any ancestor works.
  it.each(['.', './', 'src', 'src/native'])(
    'accepts the watched ancestor directory %s',
    (watchedDirectory) => {
      const config = configWatching(watchedDirectory);
      expect(withAppIntentsValidation(config, { directory: 'src/native/app-intents' })).toBe(
        config
      );
    }
  );

  it('accepts a directory watched alongside unrelated ones', () => {
    const config = configWatching('other', 'src');
    expect(withAppIntentsValidation(config, { directory: 'src/app-intents' })).toBe(config);
  });

  // `expo-router` also supports `src/app`, so intents there collide just as badly.
  it.each([
    ['app/intents', "inside 'app/'"],
    ['src/app/intents', "inside 'src/app/'"],
  ])(
    'warns when the intents directory %s is inside the expo-router app directory',
    (directory, expectedWarning) => {
      const config = {
        ...baseConfig,
        experiments: { inlineModules: { watchedDirectories: [directory] } },
      };

      expect(withAppIntents(config, { directory })).toBe(config);
      expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
        'expo-app-intents',
        expect.stringContaining(expectedWarning)
      );
    }
  );

  it('does not warn about a directory that only shares a prefix with the router directory', () => {
    const config = configWatching('app-intents');

    expect(withAppIntents(config, { directory: 'app-intents' })).toBe(config);
    expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
  });
});
