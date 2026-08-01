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
    const config = {
      ...baseConfig,
      experiments: { inlineModules: { watchedDirectories: ['other'] } },
    };
    expect(() => withAppIntentsValidation(config, { directory: 'app-intents' })).toThrow(
      /app-intents/
    );
  });

  it('passes config through when configured correctly', () => {
    const config = {
      ...baseConfig,
      experiments: { inlineModules: { watchedDirectories: ['app-intents'] } },
    };
    expect(withAppIntentsValidation(config, { directory: 'app-intents' })).toBe(config);
  });

  it('warns when the intents directory is inside the expo-router app directory', () => {
    const config = {
      ...baseConfig,
      experiments: { inlineModules: { watchedDirectories: ['app/intents'] } },
    };

    expect(withAppIntents(config, { directory: 'app/intents' })).toBe(config);
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'expo-app-intents',
      expect.stringContaining("inside 'app/'")
    );
  });
});
