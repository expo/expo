import type Log from '@expo/bunyan';
import { ExpoConfig, getConfigFilePaths } from '@expo/config';
import type { LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import http from 'http';
import type Metro from 'metro';
import type { BundleOptions as MetroBundleOptions } from 'metro/src/shared/types';

import {
  buildHermesBundleAsync,
  isEnableHermesManaged,
  maybeThrowFromInconsistentEngineAsync,
} from './HermesBundler';
import LogReporter from './LogReporter';
import {
  importExpoMetroConfigFromProject,
  importMetroFromProject,
  importMetroServerFromProject,
} from './metro/importMetroFromProject';
import { createDevServerMiddleware } from './middleware/devServerMiddleware';

export type MetroDevServerOptions = LoadOptions & {
  logger: Log;
  quiet?: boolean;
  unversioned?: boolean;
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
  map: string;
  hermesBytecodeBundle?: Uint8Array;
  hermesSourcemap?: string;
  assets: readonly BundleAssetWithFileHashes[];
};
export type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

function getExpoMetroConfig(
  projectRoot: string,
  { logger, unversioned }: Pick<MetroDevServerOptions, 'logger' | 'unversioned'>
): typeof import('@expo/metro-config') {
  if (!unversioned) {
    try {
      return importExpoMetroConfigFromProject(projectRoot);
    } catch {
      // If expo isn't installed, use the unversioned config and warn about installing expo.
    }
  }

  const unversionedVersion = require('@expo/metro-config/package.json').version;
  logger.info(
    { tag: 'expo' },
    chalk.gray(
      `\u203A Unversioned ${chalk.bold`@expo/metro-config@${unversionedVersion}`} is being used. Bundling apps may not work as expected, and is subject to breaking changes. Install ${chalk.bold`expo`} or set the app.json sdkVersion to use a stable version of @expo/metro-config.`
    )
  );

  return require('@expo/metro-config');
}

let nextBuildID = 0;

/** @deprecated */
export async function bundleAsync(
  projectRoot: string,
  expoConfig: ExpoConfig,
  options: MetroDevServerOptions,
  bundles: BundleOptions[]
): Promise<BundleOutput[]> {
  const metro = importMetroFromProject(projectRoot);
  const Server = importMetroServerFromProject(projectRoot);

  const reporter = new LogReporter(options.logger);
  const ExpoMetroConfig = getExpoMetroConfig(projectRoot, options);

  const config = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });
  const buildID = `bundle_${nextBuildID++}`;

  const metroServer = await metro.runMetro(config, {
    watch: false,
  });

  const buildAsync = async (bundle: BundleOptions): Promise<BundleOutput> => {
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
    reporter.update({
      buildID,
      type: 'bundle_build_started',
      bundleDetails: {
        bundleType: bundleOptions.bundleType,
        platform: bundle.platform,
        entryFile: bundle.entryPoint,
        dev: bundle.dev ?? false,
        minify: !isHermes && (bundle.minify ?? !bundle.dev),
      },
    });
    const { code, map } = await metroServer.build(bundleOptions);
    const assets = (await metroServer.getAssets(
      bundleOptions
    )) as readonly BundleAssetWithFileHashes[];
    reporter.update({
      buildID,
      type: 'bundle_build_done',
    });
    return { code, map, assets };
  };

  const maybeAddHermesBundleAsync = async (
    bundle: BundleOptions,
    bundleOutput: BundleOutput
  ): Promise<BundleOutput> => {
    const { platform } = bundle;
    const isHermesManaged = isEnableHermesManaged(expoConfig, platform);

    const paths = getConfigFilePaths(projectRoot);
    const configFilePath = paths.dynamicConfigPath ?? paths.staticConfigPath ?? 'app.json';
    await maybeThrowFromInconsistentEngineAsync(
      projectRoot,
      configFilePath,
      platform,
      isHermesManaged
    );

    if (isHermesManaged) {
      const platformTag = chalk.bold(
        { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform
      );
      options.logger.info(
        { tag: 'expo' },
        `💿 ${platformTag} Building Hermes bytecode for the bundle`
      );
      const hermesBundleOutput = await buildHermesBundleAsync(
        projectRoot,
        bundleOutput.code,
        bundleOutput.map,
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
  } finally {
    metroServer.end();
  }
}

export { LogReporter, createDevServerMiddleware };
export * from './middlwareMutations';
export * from './JsInspector';
