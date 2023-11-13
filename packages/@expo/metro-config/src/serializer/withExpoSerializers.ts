/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import {
  Module,
  MixedOutput,
  ReadOnlyGraph,
  SerializerOptions,
  MetroConfig,
  AssetData,
} from 'metro';
import getMetroAssets from 'metro/src/DeltaBundler/Serializers/getAssets';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import { ConfigT, InputConfigT, SerializerConfigT } from 'metro-config';
import path from 'path';
import pathToRegExp from 'path-to-regexp';

import {
  environmentVariableSerializerPlugin,
  serverPreludeSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { buildHermesBundleAsync } from './exportHermes';
import { getExportPathForDependencyWithOptions } from './exportPath';
// import baseJSBundle from 'metro/src/DeltaBundler/Serializers/baseJSBundle';
import {
  baseJSBundle,
  baseJSBundleWithDependencies,
  getBasePathOption,
  getPlatformOption,
  getSplitChunksOption,
} from './fork/baseJSBundle';
import { getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { env } from '../env';

// import { toFixture } from './__tests__/fixtures/toFixture';
export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

export type SerializerParameters = Parameters<Serializer>;

// A serializer that processes the input and returns a modified version.
// Unlike a serializer, these can be chained together.
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;

export function withExpoSerializers(config: InputConfigT): InputConfigT {
  const processors: SerializerPlugin[] = [];
  processors.push(serverPreludeSerializerPlugin);
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
  config: MetroConfig,
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

    // @ts-expect-error
    const customSerializerOptions = options.serializerOptions;

    // Custom options can only be passed outside of the dev server, meaning
    // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
    const supportsNonSerialReturn = !!customSerializerOptions?.output;

    const serializerOptions = (() => {
      if (customSerializerOptions) {
        return {
          outputMode: customSerializerOptions.output,
          includeSourceMaps: customSerializerOptions.includeMaps,
        };
      }
      if (options.sourceUrl) {
        const sourceUrl = isJscSafeUrl(options.sourceUrl)
          ? toNormalUrl(options.sourceUrl)
          : options.sourceUrl;

        const url = new URL(sourceUrl, 'https://expo.dev');

        return {
          outputMode: url.searchParams.get('serializer.output'),
          includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
        };
      }
      return null;
    })();

    if (serializerOptions?.outputMode !== 'static') {
      return defaultSerializer(...props);
    }

    const assets = await graphToSerialAssetsAsync(
      config,
      { includeMaps: serializerOptions.includeSourceMaps },
      ...props
    );

    if (supportsNonSerialReturn) {
      // @ts-expect-error: this is future proofing for adding assets to the output as well.
      return assets;
    }

    return JSON.stringify(assets);
  };
}

type ChunkSettings = {
  /** Match the initial modules. */
  test: RegExp;
};

export async function graphToSerialAssetsAsync(
  config: MetroConfig,
  { includeMaps }: { includeMaps: boolean },
  ...props: SerializerParameters
): Promise<{ artifacts: SerialAsset[] | null; assets: AssetData[] }> {
  const [entryFile, preModules, graph, options] = props;

  const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
    projectRoot: options.projectRoot,
    processModuleFilter: options.processModuleFilter,
  });

  // Create chunks for splitting.
  const _chunks = new Set<Chunk>();

  [
    {
      test: pathToRegExp(entryFile),
    },
  ].map((chunkSettings) => gatherChunks(_chunks, chunkSettings, preModules, graph, options, false));

  // console.log('Chunks:');
  // console.log(inspect([..._chunks], { depth: 3, colors: true }));
  // Optimize the chunks
  // dedupeChunks(_chunks);

  const jsAssets = await serializeChunksAsync(_chunks, config.serializer ?? {}, {
    includeSourceMaps: includeMaps,
  });

  // TODO: Convert to serial assets
  // TODO: Disable this call dynamically in development since assets are fetched differently.
  const metroAssets = (await getMetroAssets(graph.dependencies, {
    processModuleFilter: options.processModuleFilter,
    assetPlugins: config.transformer!.assetPlugins ?? [],
    platform: getPlatformOption(graph, options) ?? 'web',
    projectRoot: options.projectRoot, // this._getServerRootDir(),
    publicPath: config.transformer!.publicPath!,
  })) as AssetData[];

  return { artifacts: [...jsAssets, ...cssDeps], assets: metroAssets };
}

class Chunk {
  public deps: Set<Module> = new Set();
  public preModules: Set<Module> = new Set();

  // Chunks that are required to be loaded synchronously before this chunk.
  // These are included in the HTML as <script> tags.
  public requiredChunks: Set<Chunk> = new Set();

  constructor(
    public name: string,
    public entries: Module<MixedOutput>[],
    public graph: ReadOnlyGraph<MixedOutput>,
    public options: SerializerOptions<MixedOutput>,
    public isAsync: boolean = false
  ) {
    this.deps = new Set(entries);
  }

  private getPlatform() {
    assert(
      this.graph.transformOptions.platform,
      "platform is required to be in graph's transformOptions"
    );
    return this.graph.transformOptions.platform;
  }

  getFilename() {
    // TODO: Content hash is needed
    return this.options.dev
      ? this.name
      : getExportPathForDependencyWithOptions(this.name, {
          platform: this.getPlatform(),
          serverRoot: this.options.serverRoot,
        });
  }

  serializeToCode(serializerConfig: Partial<SerializerConfigT>) {
    const entryFile = this.name;
    const fileName = path.basename(entryFile, '.js');

    const jsSplitBundle = baseJSBundleWithDependencies(
      entryFile,
      [...this.preModules.values()],
      [...this.deps],
      {
        ...this.options,
        runBeforeMainModule:
          serializerConfig?.getModulesRunBeforeMainModule?.(
            path.relative(this.options.projectRoot, entryFile)
          ) ?? [],
        // searchParams.set('modulesOnly', 'true');
        // searchParams.set('runModule', 'false');

        // TODO: Test cases when an async module has global side-effects that should be run.
        // This should be fine as those side-effects would be defined in the module itself, which would be executed upon loading.
        runModule: !this.isAsync,
        modulesOnly: this.preModules.size === 0,
        platform: this.getPlatform(),
        sourceMapUrl: `${fileName}.map`,
        basePath: getBasePathOption(this.graph, this.options) ?? '/',
        splitChunks: getSplitChunksOption(this.graph, this.options),
      }
    );

    return bundleToString(jsSplitBundle).code;
  }

  async serializeToAssetsAsync(
    serializerConfig: Partial<SerializerConfigT>,
    { includeSourceMaps }: { includeSourceMaps?: boolean }
  ): Promise<SerialAsset[]> {
    const jsCode = this.serializeToCode(serializerConfig);

    const relativeEntry = path.relative(this.options.projectRoot, this.name);
    const outputFile = this.getFilename();

    const jsAsset: SerialAsset = {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        isAsync: this.isAsync,
        requires: [...this.requiredChunks.values()].map((chunk) => chunk.getFilename()),
      },
      source: jsCode,
    };

    const assets: SerialAsset[] = [jsAsset];

    if (
      // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
      includeSourceMaps &&
      this.options.sourceMapUrl
    ) {
      const modules = [
        ...this.preModules,
        ...getSortedModules([...this.deps], {
          createModuleId: this.options.createModuleId,
        }),
      ].map((module) => {
        // TODO: Make this user-configurable.

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        if (module.path.startsWith('/')) {
          return {
            ...module,
            path:
              '/' + path.relative(this.options.serverRoot ?? this.options.projectRoot, module.path),
          };
        }
        return module;
      });

      const sourceMap = sourceMapString(modules, {
        ...this.options,
      });

      assets.push({
        filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
        originFilename: jsAsset.originFilename,
        type: 'map',
        metadata: {},
        source: sourceMap,
      });
    }

    if (this.isHermesEnabled()) {
      // TODO: Generate hbc for each chunk
      const hermesBundleOutput = await buildHermesBundleAsync({
        filename: this.name,
        code: jsAsset.source,
        map: assets[1] ? assets[1].source : null,
        // TODO: Maybe allow prod + no minify.
        minify: true, //!this.options.dev,
      });

      if (hermesBundleOutput.hbc) {
        // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
        // jsAsset.metadata.hbc = hermesBundleOutput.hbc;
        // @ts-expect-error: TODO
        jsAsset.source = hermesBundleOutput.hbc;
        jsAsset.filename = jsAsset.filename.replace(/\.js$/, '.hbc');
      }
      if (assets[1] && hermesBundleOutput.sourcemap) {
        // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
        assets[1].source = hermesBundleOutput.sourcemap;
      }
    }

    return assets;
  }

  isHermesEnabled() {
    // TODO: Revisit.
    // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
    // also create hermes bytecode. We may need to disable in one of the two places.
    return (
      !this.options.dev &&
      this.getPlatform() !== 'web' &&
      this.graph.transformOptions.customTransformOptions?.engine === 'hermes'
    );
  }
}

function getEntryModulesForChunkSettings(graph: ReadOnlyGraph, settings: ChunkSettings) {
  return [...graph.dependencies.entries()]
    .filter(([path]) => settings.test.test(path))
    .map(([, module]) => module);
}

function chunkIdForModules(modules: Module[]) {
  return modules
    .map((module) => module.path)
    .sort()
    .join('=>');
}

function gatherChunks(
  chunks: Set<Chunk>,
  settings: ChunkSettings,
  preModules: readonly Module[],
  graph: ReadOnlyGraph,
  options: SerializerOptions<MixedOutput>,
  isAsync: boolean = false
): Set<Chunk> {
  let entryModules = getEntryModulesForChunkSettings(graph, settings);

  const existingChunks = [...chunks.values()];

  entryModules = entryModules.filter((module) => {
    return !existingChunks.find((chunk) => chunk.entries.includes(module));
  });

  // if (!entryModules.length) {
  //   throw new Error('Entry module not found in graph: ' + entryFile);
  // }

  // Prevent processing the same entry file twice.
  if (!entryModules.length) {
    return chunks;
  }

  const entryChunk = new Chunk(
    chunkIdForModules(entryModules),
    entryModules,
    graph,
    options,
    isAsync
  );

  // Add all the pre-modules to the first chunk.
  if (preModules.length) {
    if (graph.transformOptions.platform === 'web' && !isAsync) {
      // On web, add a new required chunk that will be included in the HTML.
      const preChunk = new Chunk(
        chunkIdForModules([...preModules]),
        [...preModules],
        graph,
        options
      );
      // for (const module of preModules.values()) {
      //   preChunk.deps.add(module);
      // }
      chunks.add(preChunk);
      entryChunk.requiredChunks.add(preChunk);
    } else {
      // On native, use the preModules in insert code in the entry chunk.
      for (const module of preModules.values()) {
        entryChunk.preModules.add(module);
      }
    }
  }

  const splitChunks = getSplitChunksOption(graph, options);
  chunks.add(entryChunk);

  // entryChunk.deps.add(entryModule);

  function includeModule(entryModule: Module<MixedOutput>) {
    for (const dependency of entryModule.dependencies.values()) {
      if (
        dependency.data.data.asyncType === 'async' &&
        // Support disabling multiple chunks.
        splitChunks
      ) {
        gatherChunks(
          chunks,
          { test: pathToRegExp(dependency.absolutePath) },
          [],
          graph,
          options,
          true
        );
      } else {
        const module = graph.dependencies.get(dependency.absolutePath);
        if (module) {
          // Prevent circular dependencies from creating infinite loops.
          if (!entryChunk.deps.has(module)) {
            entryChunk.deps.add(module);
            includeModule(module);
          }
        }
      }
    }
  }

  for (const entryModule of entryModules) {
    includeModule(entryModule);
  }

  return chunks;
}

// function dedupeChunks(chunks: Set<Chunk>) {
//   // Iterate chunks and pull duplicate modules into new common chunks that are required by the original chunks.

//   // We can only de-dupe sync chunks since this would create vendor/shared chunks.
//   const currentChunks = [...chunks.values()].filter((chunk) => !chunk.isAsync);
//   for (const chunk of currentChunks) {
//     const deps = [...chunk.deps.values()];
//     for (const dep of deps) {
//       for (const otherChunk of currentChunks) {
//         if (otherChunk === chunk) {
//           continue;
//         }
//         if (otherChunk.deps.has(dep)) {
//           console.log('found common dep:', dep.path, 'in', chunk.name, 'and', otherChunk.name);
//           // Move the dep into a new chunk.
//           const newChunk = new Chunk(dep.path, dep.path, chunk.graph, chunk.options, false);
//           newChunk.deps.add(dep);
//           chunk.requiredChunks.add(newChunk);
//           otherChunk.requiredChunks.add(newChunk);
//           chunks.add(newChunk);
//           // Remove the dep from the original chunk.
//           chunk.deps.delete(dep);
//           otherChunk.deps.delete(dep);

//           // TODO: Pull all the deps of the dep into the new chunk.
//           for (const depDep of dep.dependencies.values()) {
//             if (depDep.data.data.asyncType === 'async') {
//               gatherChunks(chunks, depDep.absolutePath, [], chunk.graph, chunk.options, false);
//             } else {
//               const module = chunk.graph.dependencies.get(depDep.absolutePath);
//               if (module) {
//                 newChunk.deps.add(module);
//                 if (chunk.deps.has(module)) {
//                   chunk.deps.delete(module);
//                 }
//                 if (otherChunk.deps.has(module)) {
//                   otherChunk.deps.delete(module);
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }

async function serializeChunksAsync(
  chunks: Set<Chunk>,
  serializerConfig: Partial<SerializerConfigT>,
  { includeSourceMaps }: { includeSourceMaps: boolean }
) {
  const jsAssets: SerialAsset[] = [];

  await Promise.all(
    [...chunks].map(async (chunk) => {
      jsAssets.push(
        ...(await chunk.serializeToAssetsAsync(serializerConfig, { includeSourceMaps }))
      );
    })
  );

  return jsAssets;
}

function getSortedModules(
  modules: Module<MixedOutput>[],
  {
    createModuleId,
  }: {
    createModuleId: (path: string) => number;
  }
): readonly Module<any>[] {
  // const modules = [...graph.dependencies.values()];
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort(
    (a: Module<any>, b: Module<any>) => createModuleId(a.path) - createModuleId(b.path)
  );
}

export function createSerializerFromSerialProcessors(
  config: MetroConfig,
  processors: (SerializerPlugin | undefined)[],
  originalSerializer?: Serializer | null
): Serializer {
  const finalSerializer = getDefaultSerializer(config, originalSerializer);
  return (...props: SerializerParameters): ReturnType<Serializer> => {
    // toFixture(...props);
    for (const processor of processors) {
      if (processor) {
        props = processor(...props);
      }
    }

    return finalSerializer(...props);
  };
}

export { SerialAsset };
