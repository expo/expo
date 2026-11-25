import type { ExpoConfig } from 'expo/config';
import type { ConfigPlugin, ExportedConfigWithProps, Mod } from 'expo/config-plugins';

// Usage: add the following mock to the mods you are using:
// jest.mock('../../plugins/android-plugins');

export function mockModWithResults<T>(withMod: ConfigPlugin<Mod<T>>, modResults: T) {
  // The mod is replaced by a jest mock via `jest.mock`, so it carries mock methods at runtime.
  (withMod as jest.MockedFunction<ConfigPlugin<Mod<T>>>).mockImplementationOnce(
    (config, action) => {
      return action({ ...config, modResults } as ExportedConfigWithProps<T>) as ExpoConfig;
    }
  );
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
  mockModWithResults(mod, modResults);
  return (await plugin(config as any)) as ExportedConfigWithProps<T>;
}
