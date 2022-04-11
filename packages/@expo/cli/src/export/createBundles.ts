import { getConfig, Platform } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { resolveEntryPoint } from '../start/server/middleware/resolveEntryPoint';
import { learnMore } from '../utils/link';
import { bundleAsync, BundleOutput } from './fork-bundleAsync';
import { PublishOptions } from './getPublishExpConfig';
import { createFilesTable } from './printBundleSizes';

export function printBundleSizes(bundles: { android?: BundleOutput; ios?: BundleOutput }) {
  const files: [string, string | Uint8Array][] = [];

  if (bundles.ios?.hermesBytecodeBundle) {
    files.push(['index.ios.js (Hermes)', bundles.ios.hermesBytecodeBundle]);
  } else if (bundles.ios?.code) {
    files.push(['index.ios.js', bundles.ios.code]);
  }
  if (bundles.android?.hermesBytecodeBundle) {
    files.push(['index.android.js (Hermes)', bundles.android.hermesBytecodeBundle]);
  } else if (bundles.android?.code) {
    files.push(['index.android.js', bundles.android.code]);
  }

  // Account for inline source maps
  if (bundles.ios?.hermesSourcemap) {
    files.push([chalk.dim('index.ios.js.map (Hermes)'), bundles.ios.hermesSourcemap]);
  } else if (bundles.ios?.map) {
    files.push([chalk.dim('index.ios.js.map'), bundles.ios.map]);
  }
  if (bundles.android?.hermesSourcemap) {
    files.push([chalk.dim('index.android.js.map (Hermes)'), bundles.android.hermesSourcemap]);
  } else if (bundles.android?.map) {
    files.push([chalk.dim('index.android.js.map'), bundles.android.map]);
  }

  Log.log();
  Log.log(createFilesTable(files));
  Log.log();
  Log.log(
    `💡 JavaScript bundle sizes affect startup time. ${chalk.dim(
      learnMore(`https://expo.fyi/javascript-bundle-sizes`)
    )}`
  );
  Log.log();
}

export async function createBundlesAsync(
  projectRoot: string,
  publishOptions: PublishOptions = {},
  bundleOptions: { platforms: Platform[]; dev?: boolean; useDevServer: boolean }
): Promise<Partial<Record<Platform, BundleOutput>>> {
  const config = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const bundles = await bundleAsync(
    projectRoot,
    config.exp,
    {
      // If not legacy, ignore the target option to prevent warnings from being thrown.
      target: undefined,
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
      quiet: publishOptions.quiet,
      unversioned: !config.exp.sdkVersion || config.exp.sdkVersion === 'UNVERSIONED',
    },
    bundleOptions.platforms.map((platform: Platform) => ({
      platform,
      entryPoint: resolveEntryPoint(projectRoot, platform),
      dev: bundleOptions.dev,
    }))
  );

  // { ios: bundle, android: bundle }
  const results: Record<string, BundleOutput> = {};

  for (let index = 0; index < bundleOptions.platforms.length; index++) {
    const platform = bundleOptions.platforms[index];
    const bundle = bundles[index];
    results[platform] = bundle;
  }

  return results;
}
