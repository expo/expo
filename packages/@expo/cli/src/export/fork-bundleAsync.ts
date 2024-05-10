import { ExpoConfig, getConfigFilePaths, Platform, ProjectConfig } from '@expo/config';
import { LoadOptions } from '@expo/metro-config';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import Metro from 'metro';

import { isEnableHermesManaged, maybeThrowFromInconsistentEngineAsync } from './exportHermes';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { getEntryWithServerRoot } from '../start/server/middleware/ManifestMiddleware';
import { env } from '../utils/env';

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
  metroDevServer: MetroBundlerDevServer,
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

  const buildAsync = async (bundle: BundleOptions): Promise<BundleOutput> => {
    // Assert early so the user doesn't have to wait until bundling is complete to find out that
    // Hermes won't be available.
    const isHermes = isEnableHermesManaged(exp, bundle.platform);
    if (isHermes) {
      await assertEngineMismatchAsync(projectRoot, exp, bundle.platform);
    }

    return metroDevServer.legacySinglePageBundleAsync({
      splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING && bundle.platform === 'web',
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
      // isExporting: true,
    });
  };

  const bundles = bundleOptions.platforms.map((platform: Platform) => ({
    platform,
    entryPoint: bundleOptions.entryPoint ?? getEntryWithServerRoot(projectRoot, { platform, pkg }),
    sourcemaps: bundleOptions.sourcemaps,
    minify: bundleOptions.minify,
    bytecode: bundleOptions.bytecode,
    dev: bundleOptions.dev,
  }));

  const outputBundles = await Promise.all(bundles.map((bundle) => buildAsync(bundle)));

  // { ios: bundle, android: bundle }
  return bundleOptions.platforms.reduce<Partial<Record<Platform, BundleOutput>>>(
    (prev, platform, index) => ({
      ...prev,
      [platform]: outputBundles[index],
    }),
    {}
  );
}
