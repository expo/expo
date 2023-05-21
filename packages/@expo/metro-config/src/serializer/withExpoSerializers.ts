/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Graph, MixedOutput, Module } from 'metro';
import { ConfigT, InputConfigT, SerializerConfigT } from 'metro-config';
import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from 'metro/src/lib/bundleToString';
import path from 'path';

import { env } from '../env';
import { environmentVariableSerializerPlugin } from './environmentVariableSerializerPlugin';
import { fileNameFromContents, getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';

export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  const processors: SerializerPlugin[] = [];
  if (!env.EXPO_NO_CLIENT_ENV_VARS) {
    processors.push(environmentVariableSerializerPlugin);
  }

  return withSerializerPlugins(config, processors);
}

// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
export function withSerializerPlugins(
  config: InputConfigT,
  processors: SerializerPlugin[]
): InputConfigT {
  const originalSerializer = config.serializer?.customSerializer;

  return {
    ...config,
    serializer: {
      ...config.serializer,
      customSerializer: createSerializerFromSerialProcessors(
        config,
        processors,
        originalSerializer
      ),
    },
  };
}

function getDefaultSerializer(
  serializerConfig: SerializerConfigT,
  fallbackSerializer?: Serializer
): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    ((...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      const outputCode = bundleToString(bundle).code;
      return outputCode;
    });

  return (...props: SerializerParameters): string | any => {
    const [entryFile, preModules, graph, options] = props;

    if (!options.sourceUrl) {
      return defaultSerializer(...props);
    }
    const url = new URL(options.sourceUrl, 'https://expo.dev');
    if (
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return defaultSerializer(...props);
    }

    const cssDeps = getCssSerialAssets(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    // JS

    const jsAssets: SerialAsset[] = [];

    // Create split graph from main graph
    const splitGraph = generateDependencyGraphForEachSplitPoint(new Set([entryFile]), graph).filter(
      Boolean
    );

    // moduleId: url
    const dll: Record<number, string> = {};

    splitGraph.forEach(async (graph, index) => {
      if (!graph) return;

      const entryFile = graph.entryPoints[0];

      const modulePath = graph.dependencies.get(entryFile)!.path;
      const moduleId = options.createModuleId(modulePath);

      const prependInner = index === 0 ? preModules : [];

      const fileName = path.basename(entryFile, '.js');
      const jsSplitBundle = baseJSBundle(entryFile, prependInner, graph, {
        ...options,
        runBeforeMainModule: serializerConfig.getModulesRunBeforeMainModule(
          path.relative(options.projectRoot, entryFile)
        ),
        sourceMapUrl: `${fileName}.js.map`,
      });

      const jsCode = bundleToString(jsSplitBundle).code;

      // // Save sourcemap
      // const getSortedModules = (graph) => {
      //   return [...graph.dependencies.values()].sort(
      //     (a, b) => options.createModuleId(a.path) - options.createModuleId(b.path)
      //   );
      // };
      // const sourceMapString = require('metro/src/DeltaBundler/Serializers/sourceMapString');

      // const sourceMap = sourceMapString([...prependInner, ...getSortedModules(graph)], {
      //   // excludeSource: options.excludeSource,
      //   processModuleFilter: options.processModuleFilter,
      //   shouldAddToIgnoreList: options.shouldAddToIgnoreList,
      //   // excludeSource: options.excludeSource,
      // });

      // await writeFile(outputOpts.sourceMapOutput, sourceMap, null);

      const relativeEntry = path.relative(options.projectRoot, entryFile);
      const outputFile = options.dev
        ? entryFile
        : `_expo/static/js/web/${fileNameFromContents({
            filepath: relativeEntry,
            src: jsCode,
          })}.js`;

      dll[moduleId] = '/' + outputFile;

      jsAssets.push({
        filename: outputFile,
        originFilename: relativeEntry,
        type: 'js',
        metadata: {},
        source: jsCode,
      });
    });

    jsAssets.push({
      filename: '_expo/static/json/web/dll.json',
      originFilename: 'dll.json',
      type: 'json',
      metadata: {},
      source: JSON.stringify(dll),
    });

    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}

const generateDependencyGraphForEachSplitPoint = (
  entryFiles: Set<string>,
  graph: Graph<MixedOutput>,
  multiBundles: Map<string, Set<string>> = new Map(),
  used: Set<string> = new Set()
) => {
  entryFiles.forEach((entryFile) => {
    if (multiBundles.has(entryFile)) {
      return multiBundles;
    }

    const result = getTransitiveDependencies(entryFile, graph, used);
    multiBundles.set(entryFile, result.deps);
    used = new Set([...used, ...result.deps]);

    if (result.entries.size > 0) {
      generateDependencyGraphForEachSplitPoint(result.entries, graph, multiBundles, used);
    }
  });

  return buildDependenciesForEachSplitPoint(multiBundles, graph);
};

const getTransitiveDependencies = (path: string, graph: Graph<MixedOutput>, used: Set<string>) => {
  const result = collectDependenciesForSplitGraph(path, graph, new Set(), new Set(), used);
  result.deps.delete(path);
  return result;
};

const collectDependenciesForSplitGraph = (
  path: string,
  graph: Graph<MixedOutput>,
  deps: Set<string>,
  entries: Set<string>,
  used: Set<string>
) => {
  if (deps.has(path) || used.has(path)) {
    return { deps, entries };
  }

  const module = graph.dependencies.get(path);

  if (!module) {
    return { deps, entries };
  }

  deps.add(path);

  for (const dependency of module.dependencies.values()) {
    if (dependency.data.data.asyncType === 'async') {
      entries.add(dependency.absolutePath);
    } else {
      collectDependenciesForSplitGraph(dependency.absolutePath, graph, deps, entries, used);
    }
  }

  return { deps, entries };
};

const buildDependenciesForEachSplitPoint = (
  multiBundles: Map<string, Set<string>>,
  graph: Graph<MixedOutput>
) => {
  return [...multiBundles.entries()].map((bundle) => {
    const deps = [...bundle[1].values()].map((dep) => [dep, graph.dependencies.get(dep)!]) as [
      string,
      Module
    ][];
    if (!graph.dependencies.get(bundle[0])) {
      return null;
      // 'Async module is missing from graph. This can happen when lazy bundling is enabled'
    }
    return {
      dependencies: new Map([
        // Initial
        [bundle[0], graph.dependencies.get(bundle[0])!],
        // Others
        ...deps,
      ]),
      entryPoints: [bundle[0]],
      // IDK...
      importBundleNames: new Set(),
    };
  });
};

export function createSerializerFromSerialProcessors(
  config: ConfigT,
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer
): Serializer {
  const finalSerializer = getDefaultSerializer(config?.serializer, originalSerializer);
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
