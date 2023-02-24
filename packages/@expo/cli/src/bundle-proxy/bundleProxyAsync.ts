import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';
import { importCliBuildBundleWithConfigFromProject } from '../start/server/metro/resolveFromProject';
import { Options } from './resolveOptions';

export async function bundleProxyAsync(projectRoot: string, options: Options) {
  const { config } = await loadMetroConfigAsync(projectRoot, {
    maxWorkers: options.maxWorkers,
    resetCache: options.resetCache,
    config: options.config,
  });

  const buildBundleWithConfig = importCliBuildBundleWithConfigFromProject(projectRoot);

  await buildBundleWithConfig(
    options,
    // @ts-expect-error: MetroConfig type mismatch.
    config
  );
}
