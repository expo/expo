import { ExpoConfig, getConfigFilePaths, Platform } from '@expo/config';
import { LoadOptions, loadAsync } from '@expo/metro-config';
import chalk from 'chalk';
import Metro from 'metro';
import { Terminal } from 'metro-core';

import {
  buildHermesBundleAsync,
  isEnableHermesManaged,
  maybeThrowFromInconsistentEngineAsync,
} from '../start/server/metro/HermesBundler';
import { MetroTerminalReporter } from '../start/server/metro/MetroTerminalReporter';
import {
  importMetroFromProject,
  importMetroServerFromProject,
} from '../start/server/metro/resolveFromProject';
import { withMetroMultiPlatformAsync } from '../start/server/metro/withMetroMultiPlatform';
import { getPlatformBundlers } from '../start/server/platformBundlers';

export type BundleOptions = {
  entryPoint: string;
  platform: Platform;
  dev?: boolean;
  minify?: boolean;
  sourceMapUrl?: string;
};

export type BundleAssetWithFileHashes = Metro.AssetData & {
  fileHashes: string[]; // added by the hashAssets asset plugin (For EAS Update server)
};

export type BundleOutput = {
  code: string;
  map?: string;
  hermesBytecodeBundle?: Uint8Array;
  hermesSourcemap?: string;
  assets: readonly BundleAssetWithFileHashes[];
};

let nextBuildID = 0;

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
  options: LoadOptions,
  bundles: BundleOptions[]
): Promise<Partial<Record<Platform, BundleOutput>>> {
  // Assert early so the user doesn't have to wait until bundling is complete to find out that
  // Hermes won't be available.
  await Promise.all(
    bundles.map(({ platform }) => assertEngineMismatchAsync(projectRoot, expoConfig, platform))
  );

  const metro = importMetroFromProject(projectRoot);
  const Server = importMetroServerFromProject(projectRoot);

  const terminal = new Terminal(process.stdout);
  const terminalReporter = new MetroTerminalReporter(projectRoot, terminal);

  const reporter = {
    update(event: any) {
      terminalReporter.update(event);
    },
  };

  let config = await loadAsync(projectRoot, { reporter, ...options });

  const bundlerPlatforms = getPlatformBundlers(expoConfig);

  config = await withMetroMultiPlatformAsync(projectRoot, config, bundlerPlatforms);

  const metroServer = await metro.runMetro(config, {
    watch: false,
  });

  const buildAsync = async (bundle: BundleOptions): Promise<BundleOutput> => {
    const buildID = `bundle_${nextBuildID++}_${bundle.platform}`;
    const bundleOptions: Metro.BundleOptions = {
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      bundleType: 'bundle',
      platform: bundle.platform,
      entryFile: bundle.entryPoint,
      dev: bundle.dev ?? false,
      minify: bundle.minify ?? !bundle.dev,
      inlineSourceMap: false,
      sourceMapUrl: bundle.sourceMapUrl,
      createModuleIdFactory: config.serializer.createModuleIdFactory,
      onProgress: (transformedFileCount: number, totalFileCount: number) => {
        terminalReporter.update({
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
    terminalReporter.update({
      buildID,
      type: 'bundle_build_started',
      // @ts-expect-error: TODO
      bundleDetails,
    });
    try {
      const { code, map } = await metroServer.build(bundleOptions);
      const assets = (await metroServer.getAssets(
        bundleOptions
      )) as readonly BundleAssetWithFileHashes[];
      terminalReporter.update({
        buildID,
        type: 'bundle_build_done',
      });
      return { code, map, assets };
    } catch (error) {
      terminalReporter.update({
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

      terminalReporter.terminal.log(`${platformTag} Building Hermes bytecode for the bundle`);

      const hermesBundleOutput = await buildHermesBundleAsync(
        projectRoot,
        bundleOutput.code,
        bundleOutput.map!,
        bundle.minify
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

    // ex: { ios: bundle, android: bundle }
    return bundles.reduce<Partial<Record<Platform, BundleOutput>>>(
      (prev, { platform }, index) => ({
        ...prev,
        [platform]: bundleOutputs[index],
      }),
      {}
    );
  } catch (error) {
    // New line so errors don't show up inline with the progress bar
    console.log('');
    throw error;
  } finally {
    metroServer.end();
  }
}
