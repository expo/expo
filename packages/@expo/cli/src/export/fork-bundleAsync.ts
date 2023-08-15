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
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import chalk from 'chalk';
import Metro from 'metro';
import { ConfigT } from 'metro-config';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';

import { CSSAsset, getCssModulesFromBundler } from '../start/server/metro/getCssModulesFromBundler';
import { loadMetroConfigAsync } from '../start/server/metro/instantiateMetro';
import { MetroTerminalReporter } from '../start/server/metro/MetroTerminalReporter';

/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

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
  artifacts?: SerialAsset[];
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

export type HelperOptions = Omit<
  PickRequired<Partial<MetroBundleOptions>, 'platform' | 'entryFile'>,
  // Simplify the usage by removing default types that we don't need changed.
  'bundleType' | 'createModuleIdFactory' | 'onProgress'
>;

/** Create a builder method for interacting directly with Metro. */
export function createBundleAsyncFunctionAsync(
  projectRoot: string,
  {
    metroServer,
    metroConfig,
    reporter,
  }: {
    metroServer: Metro.Server;
    metroConfig: ConfigT;
    reporter: MetroTerminalReporter;
  }
) {
  const { DEFAULT_BUNDLE_OPTIONS } = importMetroServerFromProject(projectRoot);

  function getBundleOptions(bundle: HelperOptions) {
    const buildID = `bundle_${nextBuildID++}_${bundle.platform}`;

    const bundleOptions: MetroBundleOptions = {
      ...DEFAULT_BUNDLE_OPTIONS,
      ...bundle,
      bundleType: 'bundle',
      dev: bundle.dev ?? false,
      minify: bundle.minify ?? !bundle.dev,
      createModuleIdFactory: metroConfig?.serializer?.createModuleIdFactory,
      onProgress(transformedFileCount: number, totalFileCount: number) {
        reporter.update({
          buildID,
          // TODO: Add this to the logging message
          // environment: bundle.customTransformOptions.environment,
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
    return { bundleOptions, bundleDetails };
  }

  const buildAsync = async (
    bundle: HelperOptions,
    emit: { css: boolean; assets: boolean; hermes: boolean }
  ): Promise<PickPartial<BundleOutput, 'css'>> => {
    const { bundleOptions, bundleDetails } = getBundleOptions(bundle);

    reporter.update({
      buildID: bundleDetails.buildID,
      type: 'bundle_build_started',
      bundleDetails,
    });

    try {
      const { code, map } = await metroServer.build(bundleOptions);

      const [assets, css, hermes] = await Promise.all([
        emit.assets ? metroServer.getAssets(bundleOptions) : undefined,
        emit.css
          ? getCssModulesFromBundler(metroConfig, metroServer.getBundler(), bundleOptions)
          : undefined,
        emit.hermes
          ? (async () => {
              const platformTag = chalk.bold(
                { ios: 'iOS', android: 'Android', web: 'Web' }[bundle.platform] || bundle.platform
              );

              reporter.terminal.log(`${platformTag} Building Hermes bytecode for the bundle`);

              const hermesBundleOutput = await buildHermesBundleAsync(
                projectRoot,
                code,
                map!,
                bundle.minify ?? !bundle.dev
              );
              return hermesBundleOutput;
            })()
          : undefined,
      ]);

      // if (jsCode) {
      const jsAsset: SerialAsset = {
        filename: bundle.dev
          ? 'index.js'
          : `_expo/static/js/web/${fileNameFromContents({
              filepath: path.relative(projectRoot, bundle.entryFile),
              src: code,
            })}.js`,
        originFilename: 'index.js',
        type: 'js',
        metadata: {},
        source: code,
      };
      // }

      // TODO: Rework the logs
      reporter.update({
        buildID: bundleDetails.buildID,
        type: 'bundle_build_done',
      });

      return {
        artifacts: [jsAsset, ...(css || [])],
        code,
        map,
        assets: assets as readonly BundleAssetWithFileHashes[],
        css,
        hermesBytecodeBundle: hermes?.hbc,
        hermesSourcemap: hermes?.sourcemap,
      };
    } catch (error) {
      reporter.update({
        buildID: bundleDetails.buildID,
        type: 'bundle_build_failed',
      });

      throw error;
    }
  };

  return buildAsync;
}

import path from 'node:path';
import crypto from 'node:crypto';

function hashString(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function fileNameFromContents({ filepath, src }: { filepath: string; src: string }): string {
  return getFileName(filepath) + '-' + hashString(filepath + src);
}

export function getFileName(module: string) {
  return path.basename(module).replace(/\.[^.]+$/, '');
}
