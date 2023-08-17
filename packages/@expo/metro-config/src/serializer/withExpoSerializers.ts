/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import { MixedOutput, Module, ReadOnlyGraph } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';

// import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from 'metro/src/lib/bundleToString';
import path from 'path';

import { environmentVariableSerializerPlugin } from './environmentVariableSerializerPlugin';
import { baseJSBundle } from './fork/baseJSBundle';
import { getExportPathForDependency } from './fork/js';
import { getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { env } from '../env';

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
        config.serializer ?? {},
        processors,
        originalSerializer
      ),
    },
  };
}

function getDefaultSerializer(
  serializerConfig: ConfigT['serializer'],
  fallbackSerializer?: Serializer | null
): Serializer {
  const defaultSerializer =
    fallbackSerializer ??
    (async (...params: SerializerParameters) => {
      const bundle = baseJSBundle(...params);
      const outputCode = bundleToString(bundle).code;
      return outputCode;
    });
  return async (
    ...props: SerializerParameters
  ): Promise<string | { code: string; map: string }> => {
    const [entryFile, preModules, graph, options] = props;
    // const jsCode = await defaultSerializer(...props);

    if (!options.sourceUrl) {
      return defaultSerializer(...props);
    }
    const sourceUrl = isJscSafeUrl(options.sourceUrl)
      ? toNormalUrl(options.sourceUrl)
      : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');
    if (
      url.searchParams.get('platform') !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return defaultSerializer(...props);
    }

    const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    // JS

    const jsAssets: SerialAsset[] = [];

    // Create split graph from main graph
    const splitGraph = generateDependencyGraphForEachSplitPoint(new Set([entryFile]), graph).filter(
      Boolean
    );

    // console.log('splitty', entryFile, splitGraph.length);

    // moduleId: url
    // let dll: Record<number, string> = {};

    splitGraph.forEach(async (graph, index) => {
      if (!graph) return;

      const entryFile = graph.entryPoints[0];

      const entryDependency = graph.dependencies.get(entryFile)!;
      // const modulePath = entryDependency.path;
      // const moduleId = options.createModuleId(modulePath);

      const prependInner = index === 0 ? preModules : [];

      const fileName = path.basename(entryFile, '.js');
      const jsSplitBundle = baseJSBundle(entryFile, prependInner, graph, {
        ...options,
        runBeforeMainModule: serializerConfig.getModulesRunBeforeMainModule(
          path.relative(options.projectRoot, entryFile)
        ),
        sourceMapUrl: `${fileName}.js.map`,
      });
      console.log(
        '_expoSplitBundlePaths',
        graph.entryPoints,
        graph,
        jsSplitBundle._expoSplitBundlePaths
      );

      // dll = { ...dll, ...jsSplitBundle._expoSplitBundlePaths };

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

      console.log('entry >', entryDependency, entryDependency.dependencies);
      const relativeEntry = path.relative(options.projectRoot, entryFile);
      const outputFile = options.dev
        ? entryFile
        : getExportPathForDependency(entryFile, { sourceUrl, serverRoot: options.serverRoot });
      //  `_expo/static/js/web/${fileNameFromContents({
      //     filepath: relativeEntry,
      //     src: jsCode,
      //   })}.js`;

      // dll[moduleId] = '/' + outputFile;

      jsAssets.push({
        filename: outputFile,
        originFilename: relativeEntry,
        type: 'js',
        metadata: {},
        source: jsCode,
      });
    });

    // jsAssets.push({
    //   filename: '_expo/static/json/web/dll.json',
    //   originFilename: 'dll.json',
    //   type: 'json',
    //   metadata: {},
    //   source: JSON.stringify(dll),
    // });

    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}

const generateDependencyGraphForEachSplitPoint = (
  entryFiles: Set<string>,
  graph: ReadOnlyGraph<MixedOutput>,
  multiBundles: Map<string, Set<string>> = new Map(),
  used: Set<string> = new Set()
) => {
  entryFiles.forEach((entryFile) => {
    if (multiBundles.has(entryFile)) {
      return;
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

const getTransitiveDependencies = (
  path: string,
  graph: ReadOnlyGraph<MixedOutput>,
  used: Set<string>
) => {
  const result = collectDependenciesForSplitGraph(path, graph, new Set(), new Set(), used);
  result.deps.delete(path);
  return result;
};

const collectDependenciesForSplitGraph = (
  path: string,
  graph: ReadOnlyGraph<MixedOutput>,
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
  graph: ReadOnlyGraph<MixedOutput>
) => {
  return [...multiBundles.entries()].map((bundle) => {
    const deps = [...bundle[1].values()].map((dep) => [dep, graph.dependencies.get(dep)!]) as [
      string,
      Module,
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
  config: ConfigT['serializer'],
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer | null
): Serializer {
  const finalSerializer = getDefaultSerializer(config, originalSerializer);
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

// __d((function(g,r,i,a,m,e,d){}),435,{"0":2,"1":18,"2":184,"3":103,"4":436,"5":438,"6":439,"paths":{"438":"/etc/external.bundle?platform=web"}});
