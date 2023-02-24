import { buildBundleWithConfig } from '@react-native-community/cli-plugin-metro/build/commands/bundle/buildBundle';

import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';
import { Options } from './resolveOptions';

export async function bundleProxyAsync(projectRoot: string, options: Options) {
  const { config } = await loadMetroConfigAsync(projectRoot, {
    maxWorkers: options.maxWorkers,
    resetCache: options.resetCache,
    config: options.config,
  });

  // Import the internal `buildBundleWithConfig()` function from `react-native` for the purpose
  // of exporting with `@expo/metro-config` and other defaults like a resolved project entry.
  await buildBundleWithConfig(
    options,
    // @ts-expect-error: MetroConfig type mismatch.
    config
  );
}
