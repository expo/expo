/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and better source map support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js#L1
 */

import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import type { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import getAppendScripts from 'metro/src/lib/getAppendScripts';

import { processModules } from './processModules';

export type ModuleMap = [number, string][];

export type Bundle = {
  modules: ModuleMap;
  post: string;
  pre: string;
  _expoSplitBundlePaths: [number, Record<string, string>][];
};

export type ExpoSerializerOptions = SerializerOptions & {
  serializerOptions?: {
    baseUrl?: string;
  };
};

export function getPlatformOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: Pick<SerializerOptions, 'sourceUrl'>
): string | null {
  if (graph.transformOptions?.platform != null) {
    return graph.transformOptions.platform;
  }
  if (!options.sourceUrl) {
    return null;
  }

  const sourceUrl = isJscSafeUrl(options.sourceUrl)
    ? toNormalUrl(options.sourceUrl)
    : options.sourceUrl;
  const url = new URL(sourceUrl, 'https://expo.dev');
  return url.searchParams.get('platform') ?? null;
}

export function getSplitChunksOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: Pick<SerializerOptions, 'includeAsyncPaths' | 'sourceUrl'>
): boolean {
  // Only enable when the entire bundle is being split, and only run on web.
  return !options.includeAsyncPaths && getPlatformOption(graph, options) === 'web';
}

export function getBaseUrlOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: Pick<ExpoSerializerOptions, 'serializerOptions'>
): string {
  const baseUrl = graph.transformOptions?.customTransformOptions?.baseUrl;
  if (typeof baseUrl === 'string') {
    // This tells us that the value came over a URL and may be encoded.
    const mayBeEncoded = options.serializerOptions == null;
    const option = mayBeEncoded ? decodeURIComponent(baseUrl) : baseUrl;

    return option.replace(/\/+$/, '') + '/';
  }
  return '/';
}

export function baseJSBundle(
  entryPoint: string,
  preModules: readonly Module[],
  graph: Pick<ReadOnlyGraph, 'dependencies' | 'transformOptions'>,
  options: ExpoSerializerOptions
): Bundle {
  const platform = getPlatformOption(graph, options);
  if (platform == null) {
    throw new Error('platform could not be determined for Metro bundle');
  }

  return baseJSBundleWithDependencies(entryPoint, preModules, [...graph.dependencies.values()], {
    ...options,
    baseUrl: getBaseUrlOption(graph, options),
    splitChunks: getSplitChunksOption(graph, options),
    platform,
  });
}

export function baseJSBundleWithDependencies(
  entryPoint: string,
  preModules: readonly Module[],
  dependencies: Module<MixedOutput>[],
  options: ExpoSerializerOptions & { platform: string; baseUrl: string; splitChunks: boolean }
): Bundle {
  for (const module of dependencies) {
    options.createModuleId(module.path);
  }

  const processModulesOptions = {
    filter: options.processModuleFilter,
    createModuleId: options.createModuleId,
    dev: options.dev,
    includeAsyncPaths: options.includeAsyncPaths,
    projectRoot: options.projectRoot,
    serverRoot: options.serverRoot,
    sourceUrl: options.sourceUrl,
    platform: options.platform,
    baseUrl: options.baseUrl,
    splitChunks: options.splitChunks,
  };

  // Do not prepend polyfills or the require runtime when only modules are requested
  if (options.modulesOnly) {
    preModules = [];
  }

  const preCode = processModules(preModules, processModulesOptions)
    .map(([, code]) => code.src)
    .join('\n');

  const modules = [...dependencies].sort(
    (a: Module<MixedOutput>, b: Module<MixedOutput>) =>
      options.createModuleId(a.path) - options.createModuleId(b.path)
  );

  const postCode = processModules(
    getAppendScripts(entryPoint, [...preModules, ...modules], {
      asyncRequireModulePath: options.asyncRequireModulePath,
      createModuleId: options.createModuleId,
      getRunModuleStatement: options.getRunModuleStatement,
      inlineSourceMap: options.inlineSourceMap,
      runBeforeMainModule: options.runBeforeMainModule,
      runModule: options.runModule,
      shouldAddToIgnoreList: options.shouldAddToIgnoreList,
      sourceMapUrl: options.sourceMapUrl,
      sourceUrl: options.sourceUrl,
    }),
    processModulesOptions
  )
    .map(([, code]) => code.src)
    .join('\n');

  const mods = processModules([...dependencies], processModulesOptions).map(([module, code]) => [
    options.createModuleId(module.path),
    code,
  ]);
  return {
    pre: preCode,
    post: postCode,
    modules: mods.map(([id, code]) => [
      id,
      typeof code === 'number' ? code : code.src,
    ]) as ModuleMap,
    _expoSplitBundlePaths: mods.map(([id, code]) => [
      id,
      typeof code === 'number' ? {} : code.paths,
    ]) as [number, Record<string, string>][],
  };
}
