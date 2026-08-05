import type { ExpoConfig } from 'expo/config';
import type { ConfigPlugin, ExportedConfigWithProps, Mod } from 'expo/config-plugins';

// Usage: add the following mock to the mods you are using:
// jest.mock('expo/config-plugins');

export function mockModWithResults<T>(withMod: ConfigPlugin<Mod<T>>, modResults: T) {
  // The mod is replaced by a jest mock via `jest.mock`, so it carries mock methods at runtime.
  (withMod as jest.MockedFunction<ConfigPlugin<Mod<T>>>).mockImplementationOnce(
    (config, action) => {
      return action({ ...config, modResults } as ExportedConfigWithProps<T>) as ExpoConfig;
    }
  );
}
