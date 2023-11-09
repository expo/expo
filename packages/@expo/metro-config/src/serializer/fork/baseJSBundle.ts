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

export function getPlatformOption(
  graph: Pick<ReadOnlyGraph, 'transformOptions'>,
  options: SerializerOptions
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

export function baseJSBundle(
  entryPoint: string,
  preModules: readonly Module[],
  graph: Pick<ReadOnlyGraph, 'dependencies' | 'transformOptions'>,
  options: SerializerOptions
): Bundle {
  const platform = getPlatformOption(graph, options);
  if (platform == null) {
    throw new Error('platform could not be determined for Metro bundle');
  }

  return baseJSBundleWithDependencies(entryPoint, preModules, [...graph.dependencies.values()], {
    ...options,
    platform,
  });
}

export function baseJSBundleWithDependencies(
  entryPoint: string,
  preModules: readonly Module[],
  dependencies: Module<MixedOutput>[],
  options: SerializerOptions & { platform: string }
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
