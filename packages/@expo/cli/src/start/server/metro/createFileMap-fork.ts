// Copyright © 2024 650 Industries.
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forks https://github.com/facebook/metro/blob/01b4ad6/packages/metro/src/node-haste/DependencyGraph/createFileMap.js
// and redirects to `@expo/metro-file-map`

import type MetroServer from '@expo/metro/metro/Server';
import type { ConfigT } from '@expo/metro/metro-config';
import FileMap, { DependencyPlugin, DiskCacheManager, HastePlugin } from '@expo/metro-file-map';
import ciInfo from 'ci-info';
import path from 'node:path';

import { composeMetroIgnorePatterns } from '../../../utils/composeMetroIgnorePatterns';

function getIgnorePattern(config: ConfigT): RegExp {
  const { blockList, blacklistRE } = config.resolver;
  return composeMetroIgnorePatterns(blacklistRE || blockList);
}

interface CreateFileMapOptions {
  extractDependencies?: boolean;
  throwOnModuleCollision?: boolean;
  watch?: boolean;
  cacheFilePrefix?: string;
}

/**
 * Creates a `FileMap` using `@expo/metro-file-map`, matching the same config
 * interpretation as Metro's original `createFileMap`.
 */
export default function createFileMap(config: ConfigT, options?: CreateFileMapOptions) {
  const watch = options?.watch == null ? !ciInfo.isCI : options.watch;

  const { enabled: autoSaveEnabled, ...autoSaveOpts } = config.watcher.unstable_autoSaveCache ?? {};
  const autoSave = watch && autoSaveEnabled ? autoSaveOpts : false;

  const plugins = [...(config.unstable_fileMapPlugins ?? [])];
  let dependencyPlugin: DependencyPlugin | null = null;

  if (config.resolver.dependencyExtractor != null && options?.extractDependencies !== false) {
    dependencyPlugin = new DependencyPlugin({
      dependencyExtractor: config.resolver.dependencyExtractor,
      computeDependencies: true,
    });
    plugins.push(dependencyPlugin);
  }

  const hasteMap = new HastePlugin({
    platforms: new Set([...config.resolver.platforms, FileMap.H.NATIVE_PLATFORM]),
    hasteImplModulePath: config.resolver.hasteImplModulePath ?? null,
    enableHastePackages: config.resolver.enableGlobalPackages,
    rootDir: config.projectRoot,
    failValidationOnConflicts: options?.throwOnModuleCollision ?? true,
  });
  plugins.push(hasteMap);

  const projectRoot = config.projectRoot;
  const serverRoot = config.server.unstable_serverRoot;
  const enableFallback = !!config.resolver.unstable_onDemandFilesystem;

  // NOTE(@kitten): We allow the on-demand filesystem to escape the server root and access any file,
  // - if we're using the CLI from `expo/expo` on an external project (e.g. in CI(
  // - if the user explicitly sets the experimental flag to 'UNSTABLE_ALLOW_ALL'
  const scopeFallback =
    enableFallback &&
    config.resolver.unstable_onDemandFilesystem !== 'UNSTABLE_ALLOW_ALL' &&
    isDirectoryIn(__dirname, serverRoot ?? projectRoot);

  const fileMap = new FileMap({
    // NOTE(@kitten): Dropped `config.unstable_fileMapCacheManagerFactory`
    cacheManagerFactory: (factoryParams: any) => {
      return new DiskCacheManager(factoryParams, {
        cacheDirectory: config.fileMapCacheDirectory ?? config.hasteMapCacheDirectory,
        cacheFilePrefix: options?.cacheFilePrefix,
        autoSave,
      });
    },
    perfLoggerFactory: config.unstable_perfLoggerFactory,
    computeSha1: !config.watcher.unstable_lazySha1,
    enableSymlinks: true,
    // NOTE(@kitten): @expo/metro-file-map fork adds `enableFallback` and `scopeFallback`
    enableFallback,
    scopeFallback,
    extensions: Array.from(
      new Set([
        ...config.resolver.sourceExts,
        ...config.resolver.assetExts,
        ...config.watcher.additionalExts,
      ])
    ),
    healthCheck: config.watcher.healthCheck,
    ignorePattern: getIgnorePattern(config),
    maxWorkers: config.maxWorkers,
    plugins,
    retainAllFiles: true,
    resetCache: config.resetCache,
    rootDir: projectRoot,
    roots: config.watchFolders,
    useWatchman: config.resolver.useWatchman ?? false,
    watch,
    watchmanDeferStates: config.watcher.watchman.deferStates,
    // NOTE: (@expo/metro-file-map fork) New option is required for `scopeFallback: true` checks
    serverRoot,
  });

  return {
    fileMap,
    hasteMap,
    dependencyPlugin,
  };
}

function isDirectoryIn(targetPath: string, rootPath: string) {
  return targetPath === rootPath || targetPath.startsWith(rootPath + path.sep);
}

function assertMetroFileMapPatched(metro: { getBundler(): any }): void {
  const depGraph = metro.getBundler().getBundler()?._depGraph;
  const fileMap = depGraph?._haste;
  if (!fileMap || !fileMap.__expo) {
    throw new Error(
      '@expo/metro-file-map was not used by Metro. ' +
        "The DependencyGraph's file map does not have the __expo flag, " +
        'which means the createFileMap module export was not replaced before ' +
        'Metro instantiated. Ensure replaceMetroFileMap() is called before runServer().'
    );
  }
}

export async function replaceMetroFileMap<T extends { readonly metro: MetroServer }>(
  immediate: () => T | PromiseLike<T>
): Promise<T> {
  const createFileMapModule = require('@expo/metro/metro/node-haste/DependencyGraph/createFileMap');
  Object.defineProperty(createFileMapModule, 'default', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: createFileMap,
  });
  const result = await immediate();
  assertMetroFileMapPatched(result.metro);
  return result;
}
