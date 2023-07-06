import { ExpoConfig, getConfigFilePaths, Platform } from '@expo/config';
import {
  buildHermesBundleAsync,
  isEnableHermesManaged,
  maybeThrowFromInconsistentEngineAsync,
} from '@expo/dev-server/build/HermesBundler';
import {
  importMetroFromProject,
  importMetroServerFromProject,
} from '@expo/dev-server/build/metro/importMetroFromProject';
import type { LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import Metro from 'metro';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';

import { CSSAsset, getCssModulesFromBundler } from '../start/server/metro/getCssModulesFromBundler';
import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';

export type MetroDevServerOptions = LoadOptions & {
  logger: import('@expo/bunyan');
  quiet?: boolean;
};
export type BundleOptions = {
  entryPoint: string;
  platform: 'android' | 'ios' | 'web';
  dev?: boolean;
  minify?: boolean;
  sourceMapUrl?: string;
};
export type BundleAssetWithFileHashes = Metro.AssetData & {
  fileHashes: string[]; // added by the hashAssets asset plugin
};
export type BundleOutput = {
  code: string;
  map?: string;
  hermesBytecodeBundle?: Uint8Array;
  hermesSourcemap?: string;
  css: CSSAsset[];
  assets: readonly BundleAssetWithFileHashes[];
};

let nextBuildID = 0;

// Fork of @expo/dev-server bundleAsync to add Metro logging back.

async function assertEngineMismatchAsync(projectRoot: string, exp: ExpoConfig, platform: Platform) {
  const isHermesManaged = isEnableHermesManaged(exp, platform);

  const paths = getConfigFilePaths(projectRoot);
  const configFilePath = paths.dynamicConfigPath ?? paths.staticConfigPath ?? 'app.json';
  await maybeThrowFromInconsistentEngineAsync(
    projectRoot,
    configFilePath,
    platform,
    isHermesManaged
  );
}

export async function bundleAsync(
  projectRoot: string,
  expoConfig: ExpoConfig,
  options: MetroDevServerOptions,
  bundles: BundleOptions[]
): Promise<BundleOutput[]> {
  // Assert early so the user doesn't have to wait until bundling is complete to find out that
  // Hermes won't be available.
  await Promise.all(
    bundles.map(({ platform }) => assertEngineMismatchAsync(projectRoot, expoConfig, platform))
  );

  const metro = importMetroFromProject(projectRoot);
  const Server = importMetroServerFromProject(projectRoot);

  const { config, reporter } = await loadMetroConfigAsync(projectRoot, options, {
    exp: expoConfig,
  });

  const metroServer = await metro.runMetro(config, {
    watch: false,
  });

  const buildAsync = async (bundle: BundleOptions): Promise<BundleOutput> => {
    const buildID = `bundle_${nextBuildID++}_${bundle.platform}`;
    const isHermes = isEnableHermesManaged(expoConfig, bundle.platform);
    const bundleOptions: MetroBundleOptions = {
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      bundleType: 'bundle',
      platform: bundle.platform,
      entryFile: bundle.entryPoint,
      dev: bundle.dev ?? false,
      minify: !isHermes && (bundle.minify ?? !bundle.dev),
      inlineSourceMap: false,
      sourceMapUrl: bundle.sourceMapUrl,
      createModuleIdFactory: config.serializer.createModuleIdFactory,
      onProgress: (transformedFileCount: number, totalFileCount: number) => {
        if (!options.quiet) {
          reporter.update({
            buildID,
            type: 'bundle_transform_progressed',
            transformedFileCount,
            totalFileCount,
          });
        }
      },
    };
    const bundleDetails = {
      ...bundleOptions,
      buildID,
    };
    reporter.update({
      buildID,
      type: 'bundle_build_started',
      bundleDetails,
    });
    try {
      const { code, map } = await metroServer.build(bundleOptions);
      const [assets, css] = await Promise.all([
        metroServer.getAssets(bundleOptions),
        getCssModulesFromBundler(config, metroServer.getBundler(), bundleOptions),
      ]);

      reporter.update({
        buildID,
        type: 'bundle_build_done',
      });
      return { code, map, assets: assets as readonly BundleAssetWithFileHashes[], css };
    } catch (error) {
      reporter.update({
        buildID,
        type: 'bundle_build_failed',
      });

      throw error;
    }
  };

  const maybeAddHermesBundleAsync = async (
    bundle: BundleOptions,
    bundleOutput: BundleOutput
  ): Promise<BundleOutput> => {
    const { platform } = bundle;
    const isHermesManaged = isEnableHermesManaged(expoConfig, platform);
    if (isHermesManaged) {
      const platformTag = chalk.bold(
        { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform
      );

      reporter.terminal.log(`${platformTag} Building Hermes bytecode for the bundle`);

      const hermesBundleOutput = await buildHermesBundleAsync(
        projectRoot,
        bundleOutput.code,
        bundleOutput.map!,
        bundle.minify ?? !bundle.dev
      );
      bundleOutput.hermesBytecodeBundle = hermesBundleOutput.hbc;
      bundleOutput.hermesSourcemap = hermesBundleOutput.sourcemap;
    }
    return bundleOutput;
  };

  try {
    const intermediateOutputs = await Promise.all(bundles.map((bundle) => buildAsync(bundle)));
    const bundleOutputs: BundleOutput[] = [];
    for (let i = 0; i < bundles.length; ++i) {
      // hermesc does not support parallel building even we spawn processes.
      // we should build them sequentially.
      bundleOutputs.push(await maybeAddHermesBundleAsync(bundles[i], intermediateOutputs[i]));
    }
    return bundleOutputs;
  } catch (error) {
    // New line so errors don't show up inline with the progress bar
    console.log('');
    throw error;
  } finally {
    metroServer.end();
  }
}
