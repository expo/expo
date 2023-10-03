import { ExpoConfig, getConfigFilePaths, Platform, ProjectConfig } from '@expo/config';
import type { LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import Metro, { AssetData } from 'metro';
import getMetroAssets from 'metro/src/DeltaBundler/Serializers/getAssets';
import splitBundleOptions from 'metro/src/lib/splitBundleOptions';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';
import { ConfigT } from 'metro-config';

import {
  buildHermesBundleAsync,
  isEnableHermesManaged,
  maybeThrowFromInconsistentEngineAsync,
} from './exportHermes';
import { CSSAsset, getCssModulesFromBundler } from '../start/server/metro/getCssModulesFromBundler';
import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';
import {
  importMetroFromProject,
  importMetroServerFromProject,
} from '../start/server/metro/resolveFromProject';
import { getEntryWithServerRoot } from '../start/server/middleware/ManifestMiddleware';

export type MetroDevServerOptions = LoadOptions;

export type BundleOptions = {
  entryPoint: string;
  platform: 'android' | 'ios' | 'web';
  dev?: boolean;
  minify?: boolean;
  sourceMapUrl?: string;
  sourcemaps?: boolean;
};
export type BundleAssetWithFileHashes = Metro.AssetData & {
  fileHashes: string[]; // added by the hashAssets asset plugin
};
export type BundleOutput = {
  code: string;
  map: string;
  hermesBytecodeBundle?: Uint8Array;
  hermesSourcemap?: string;
  css: CSSAsset[];
  assets: readonly BundleAssetWithFileHashes[];
};

let nextBuildID = 0;

async function assertEngineMismatchAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>,
  platform: Platform
) {
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

export async function createBundlesAsync(
  projectRoot: string,
  projectConfig: ProjectConfig,
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
  const { exp, pkg } = projectConfig;

  const bundles = await bundleProductionMetroClientAsync(
    projectRoot,
    exp,
    {
      // If not legacy, ignore the target option to prevent warnings from being thrown.
      resetCache: bundleOptions.clear,
      maxWorkers: bundleOptions.maxWorkers,
    },
    bundleOptions.platforms.map((platform: Platform) => ({
      platform,
      entryPoint: getEntryWithServerRoot(projectRoot, { platform, pkg }),
      sourcemaps: bundleOptions.sourcemaps,
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

async function bundleProductionMetroClientAsync(
  projectRoot: string,
  expoConfig: ExpoConfig,
  metroOptions: MetroDevServerOptions,
  bundles: BundleOptions[]
): Promise<BundleOutput[]> {
  // Assert early so the user doesn't have to wait until bundling is complete to find out that
  // Hermes won't be available.
  await Promise.all(
    bundles.map(({ platform }) => assertEngineMismatchAsync(projectRoot, expoConfig, platform))
  );

  const metro = importMetroFromProject(projectRoot);
  const Server = importMetroServerFromProject(projectRoot);

  const { config, reporter } = await loadMetroConfigAsync(projectRoot, metroOptions, {
    exp: expoConfig,
    isExporting: true,
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
        reporter.update({
          buildID,
          type: 'bundle_transform_progressed',
          transformedFileCount,
          totalFileCount,
        });
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
        getAssets(metroServer, bundleOptions),
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

      const hermesBundleOutput = await buildHermesBundleAsync(projectRoot, {
        code: bundleOutput.code,
        map: bundle.sourcemaps ? bundleOutput.map : null,
        minify: bundle.minify ?? !bundle.dev,
      });
      bundleOutput.hermesBytecodeBundle = hermesBundleOutput.hbc;
      bundleOutput.hermesSourcemap = hermesBundleOutput.sourcemap ?? undefined;
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

// Forked out of Metro because the `this._getServerRootDir()` doesn't match the development
// behavior.
export async function getAssets(
  metro: Metro.Server,
  options: MetroBundleOptions
): Promise<readonly AssetData[]> {
  const { entryFile, onProgress, resolverOptions, transformOptions } = splitBundleOptions(options);

  // @ts-expect-error: _bundler isn't exposed on the type.
  const dependencies = await metro._bundler.getDependencies(
    [entryFile],
    transformOptions,
    resolverOptions,
    { onProgress, shallow: false, lazy: false }
  );

  // @ts-expect-error
  const _config = metro._config as ConfigT;

  return await getMetroAssets(dependencies, {
    processModuleFilter: _config.serializer.processModuleFilter,
    assetPlugins: _config.transformer.assetPlugins,
    platform: transformOptions.platform!,
    projectRoot: _config.projectRoot, // this._getServerRootDir(),
    publicPath: _config.transformer.publicPath,
  });
}
