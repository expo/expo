import { getConfig, Platform, ProjectTarget } from '@expo/config';

import * as Log from '../log';
import { resolveEntryPoint } from '../start/server/middleware/resolveEntryPoint';
import { bundleAsync, BundleOutput } from './fork-bundleAsync';

export type PublishOptions = {
  releaseChannel?: string;
  target?: ProjectTarget;
  resetCache?: boolean;
  maxWorkers?: number;
};

// TODO: Reduce layers of indirection
export async function createBundlesAsync(
  projectRoot: string,
  publishOptions: PublishOptions = {},
  bundleOptions: { platforms: Platform[]; dev?: boolean; useDevServer: boolean }
): Promise<Partial<Record<Platform, BundleOutput>>> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const bundles = await bundleAsync(
    projectRoot,
    exp,
    {
      // If not legacy, ignore the target option to prevent warnings from being thrown.
      resetCache: publishOptions.resetCache,
      maxWorkers: publishOptions.maxWorkers,
      logger: {
        info(tag: unknown, message: string) {
          Log.log(message);
        },
        error(tag: unknown, message: string) {
          Log.error(message);
        },
      } as any,
      quiet: false,
    },
    bundleOptions.platforms.map((platform: Platform) => ({
      platform,
      entryPoint: resolveEntryPoint(projectRoot, platform),
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
