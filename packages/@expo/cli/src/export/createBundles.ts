import { getConfig, Platform } from '@expo/config';

import { bundleAsync, BundleOutput } from './fork-bundleAsync';
import { getEntryWithServerRoot } from '../start/server/middleware/ManifestMiddleware';

// TODO: Reduce layers of indirection
export async function createBundlesAsync(
  projectRoot: string,
  bundleOptions: {
    clear?: boolean;
    maxWorkers?: number;
    platforms: Platform[];
    dev?: boolean;
    minify?: boolean;
    sourcemaps?: boolean;
  }
): Promise<Partial<Record<Platform, BundleOutput>>> {
  if (!bundleOptions.platforms.length) {
    return {};
  }
  const projectConfig = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const { exp } = projectConfig;

  const bundles = await bundleAsync(
    projectRoot,
    exp,
    {
      // If not legacy, ignore the target option to prevent warnings from being thrown.
      resetCache: bundleOptions.clear,
      maxWorkers: bundleOptions.maxWorkers,
      quiet: false,
    },
    bundleOptions.platforms.map((platform: Platform) => ({
      sourcemaps: bundleOptions.sourcemaps,
      platform,
      entryPoint: getEntryWithServerRoot(projectRoot, projectConfig, platform),
      minify: bundleOptions.minify,
      dev: bundleOptions.dev,
    }))
  );

  // { ios: bundle, android: bundle }
  return bundleOptions.platforms.reduce<Partial<Record<Platform, BundleOutput>>>(
    (prev, platform, index) => ({
      ...prev,
      [platform]: bundles[index],
    }),
    {}
  );
}
