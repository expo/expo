import { ExpoConfig, getConfigFilePaths, Platform, ProjectConfig } from '@expo/config';
import { LoadOptions } from '@expo/metro-config';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import getMetroAssets from '@expo/metro-config/build/transform-worker/getAssets';
import assert from 'assert';
import Metro, { MixedOutput, Module, ReadOnlyGraph } from 'metro';
import type { TransformInputOptions } from 'metro/src/DeltaBundler/types';
import IncrementalBundler from 'metro/src/IncrementalBundler';
import Server from 'metro/src/Server';
import splitBundleOptions from 'metro/src/lib/splitBundleOptions';
import type {
  ResolverInputOptions,
  BundleOptions as MetroBundleOptions,
} from 'metro/src/shared/types';
import { ConfigT } from 'metro-config';
import path from 'path';

import { isEnableHermesManaged, maybeThrowFromInconsistentEngineAsync } from './exportHermes';
import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';
import { getEntryWithServerRoot } from '../start/server/middleware/ManifestMiddleware';
import {
  ExpoMetroBundleOptions,
  getMetroDirectBundleOptionsForExpoConfig,
} from '../start/server/middleware/metroOptions';
import { CommandError } from '../utils/errors';

export type MetroDevServerOptions = LoadOptions;

export type BundleOptions = {
  entryPoint: string;
  platform: 'android' | 'ios' | 'web';
  dev?: boolean;
  minify?: boolean;
  bytecode: boolean;
  sourceMapUrl?: string;
  sourcemaps?: boolean;
};
export type BundleAssetWithFileHashes = Metro.AssetData & {
  fileHashes: string[]; // added by the hashAssets asset plugin
};
export type BundleOutput = {
  artifacts: SerialAsset[];
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
    bytecode: boolean;
    sourcemaps?: boolean;
    entryPoint?: string;
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
      entryPoint:
        bundleOptions.entryPoint ?? getEntryWithServerRoot(projectRoot, { platform, pkg }),
      sourcemaps: bundleOptions.sourcemaps,
      minify: bundleOptions.minify,
      bytecode: bundleOptions.bytecode,
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

function assertMetroConfig(
  config: ConfigT
): asserts config is ConfigT & { serializer: NonNullable<ConfigT['serializer']> } {
  if (!config.serializer?.customSerializer) {
    throw new CommandError(
      'METRO_CONFIG_MALFORMED',
      `The Metro bundler configuration is missing required features from 'expo/metro-config' and cannot be used with Expo CLI. Ensure the metro.config.js file is extending 'expo/metro-config'. Learn more: https://docs.expo.dev/guides/customizing-metro`
    );
  }
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

  const { config, reporter } = await loadMetroConfigAsync(projectRoot, metroOptions, {
    exp: expoConfig,
    isExporting: true,
  });

  assertMetroConfig(config);

  const metroServer = await Metro.runMetro(config, {
    watch: false,
  });

  const buildAsync = async (bundle: BundleOptions): Promise<BundleOutput> => {
    const buildID = `bundle_${nextBuildID++}_${bundle.platform}`;
    const isHermes = isEnableHermesManaged(expoConfig, bundle.platform);
    if (isHermes) {
      await assertEngineMismatchAsync(projectRoot, expoConfig, bundle.platform);
    }
    const bundleOptions: MetroBundleOptions = {
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      sourceMapUrl: bundle.sourceMapUrl,
      ...getMetroDirectBundleOptionsForExpoConfig(projectRoot, expoConfig, {
        minify: bundle.minify,
        mainModuleName: bundle.entryPoint,
        platform: bundle.platform,
        mode: bundle.dev ? 'development' : 'production',
        engine: isHermes ? 'hermes' : undefined,
        serializerIncludeMaps: bundle.sourcemaps,
        bytecode: bundle.bytecode && isHermes,
        // Bundle splitting on web-only for now.
        // serializerOutput: bundle.platform === 'web' ? 'static' : undefined,
        serializerOutput: 'static',
        isExporting: true,
      }),
      bundleType: 'bundle',
      inlineSourceMap: false,
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
      const artifacts = await forkMetroBuildAsync(metroServer, bundleOptions);
      reporter.update({
        buildID,
        type: 'bundle_build_done',
      });
      return artifacts;
    } catch (error) {
      reporter.update({
        buildID,
        type: 'bundle_build_failed',
      });

      throw error;
    }
  };

  try {
    return await Promise.all(bundles.map((bundle) => buildAsync(bundle)));
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
export async function getAssets(metro: Metro.Server, options: MetroBundleOptions) {
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

  return getMetroAssets(dependencies, {
    processModuleFilter: _config.serializer.processModuleFilter,
    assetPlugins: _config.transformer.assetPlugins,
    platform: transformOptions.platform!,
    projectRoot: _config.projectRoot, // this._getServerRootDir(),
    publicPath: _config.transformer.publicPath,
  });
}

function isMetroServerInstance(metro: Metro.Server): metro is Metro.Server & {
  _shouldAddModuleToIgnoreList: (module: Module<MixedOutput>) => boolean;
  _bundler: IncrementalBundler;
  _config: ConfigT;
  _createModuleId: (path: string) => number;
  _resolveRelativePath(
    filePath: string,
    {
      relativeTo,
      resolverOptions,
      transformOptions,
    }: {
      relativeTo: 'project' | 'server';
      resolverOptions: ResolverInputOptions;
      transformOptions: TransformInputOptions;
    }
  ): Promise<string>;
  _getEntryPointAbsolutePath(entryFile: string): string;
  _getSortedModules(graph: ReadOnlyGraph): Module<MixedOutput>[];
} {
  return '_shouldAddModuleToIgnoreList' in metro;
}

async function forkMetroBuildAsync(
  metro: Metro.Server,
  options: ExpoMetroBundleOptions
): Promise<{ artifacts: SerialAsset[]; assets: readonly BundleAssetWithFileHashes[] }> {
  if (!isMetroServerInstance(metro)) {
    throw new Error('Expected Metro server instance to have private functions exposed.');
  }

  if (options.serializerOptions?.output !== 'static') {
    throw new Error('Only multi-serializer output is supported.');
  }

  const {
    entryFile,
    graphOptions,
    onProgress,
    resolverOptions,
    serializerOptions,
    transformOptions,
  } = splitBundleOptions(options);

  const { prepend, graph } = await metro._bundler.buildGraph(
    entryFile,
    transformOptions,
    resolverOptions,
    {
      onProgress,
      shallow: graphOptions.shallow,
      // @ts-expect-error
      lazy: graphOptions.lazy,
    }
  );

  const entryPoint = metro._getEntryPointAbsolutePath(entryFile);

  const bundleOptions = {
    asyncRequireModulePath: await metro._resolveRelativePath(
      metro._config.transformer.asyncRequireModulePath,
      {
        relativeTo: 'project',
        resolverOptions,
        transformOptions,
      }
    ),
    processModuleFilter: metro._config.serializer.processModuleFilter,
    createModuleId: metro._createModuleId,
    getRunModuleStatement: metro._config.serializer.getRunModuleStatement,
    dev: transformOptions.dev,
    includeAsyncPaths: graphOptions.lazy,
    projectRoot: metro._config.projectRoot,
    modulesOnly: serializerOptions.modulesOnly,
    runBeforeMainModule: metro._config.serializer.getModulesRunBeforeMainModule(
      path.relative(metro._config.projectRoot, entryPoint)
    ),
    runModule: serializerOptions.runModule,
    sourceMapUrl: serializerOptions.sourceMapUrl,
    sourceUrl: serializerOptions.sourceUrl,
    inlineSourceMap: serializerOptions.inlineSourceMap,
    serverRoot: metro._config.server.unstable_serverRoot ?? metro._config.projectRoot,
    shouldAddToIgnoreList: (module: Module<MixedOutput>) =>
      metro._shouldAddModuleToIgnoreList(module),
    // Custom options we pass to the serializer to emulate the URL query parameters.
    serializerOptions: options.serializerOptions,
  };

  assertMetroConfig(metro._config);

  const bundle = await metro._config.serializer.customSerializer!(
    entryPoint,
    // @ts-expect-error: Metro is typed incorrectly
    prepend,
    graph,
    bundleOptions
  );

  try {
    const parsed = typeof bundle === 'string' ? JSON.parse(bundle) : bundle;

    assert(
      'artifacts' in parsed && Array.isArray(parsed.artifacts),
      'Expected serializer to return an object with key artifacts to contain an array of serial assets.'
    );
    return parsed;
  } catch (error: any) {
    throw new Error(
      'Serializer did not return expected format. The project copy of `expo/metro-config` may be out of date. Error: ' +
        error.message
    );
  }
}
