import type { ExpoConfig } from '@expo/config';
import type { ConfigPlugin, ExportedConfigWithProps, Mod } from '@expo/config-plugins';

// Usage: add the following mock to the mods you are using:
// jest.mock('../../plugins/android-plugins');

export function mockModWithResults<T>(
  withMod: jest.MockedFunction<ConfigPlugin<Mod<T>>>,
  modResults: T
) {
  withMod.mockImplementationOnce(((config: ExpoConfig, action: Mod<T>) => {
    return action({ ...config, modResults } as ExportedConfigWithProps<T>);
  }) as ConfigPlugin<Mod<T>>);
}

/**
 * Mock a single mod and evaluate the plugin that uses that mod
 * @param config
 * @param param1
 * @returns
 */
export async function compileMockModWithResultsAsync<T>(
  config: Partial<ExpoConfig>,
  {
    mod,
    plugin,
    modResults,
  }: {
    mod: ConfigPlugin<Mod<T>>;
    plugin: ConfigPlugin;
    modResults: T;
  }
): Promise<ExportedConfigWithProps<T>> {
  // `mod` is statically a ConfigPlugin but is jest-mocked at runtime by callers.
  mockModWithResults(mod as jest.MockedFunction<ConfigPlugin<Mod<T>>>, modResults);
  return (await plugin(config as ExpoConfig)) as ExportedConfigWithProps<T>;
}
