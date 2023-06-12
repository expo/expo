import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { importCliBuildBundleWithConfigFromProject } from '../../start/server/metro/resolveFromProject';
import { setNodeEnv } from '../../utils/nodeEnv';
import { Options } from './resolveOptions';

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const { config } = await loadMetroConfigAsync(projectRoot, {
    maxWorkers: options.maxWorkers,
    resetCache: options.resetCache,
    config: options.config,
  });

  const buildBundleWithConfig = importCliBuildBundleWithConfigFromProject(projectRoot);

  // Import the internal `buildBundleWithConfig()` function from `react-native` for the purpose
  // of exporting with `@expo/metro-config` and other defaults like a resolved project entry.
  await buildBundleWithConfig(options, config);
}
