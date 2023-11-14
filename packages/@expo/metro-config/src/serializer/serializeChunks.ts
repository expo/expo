/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import {
  AssetData,
  MetroConfig,
  MixedOutput,
  Module,
  ReadOnlyGraph,
  SerializerOptions,
} from 'metro';
import getMetroAssets from 'metro/src/DeltaBundler/Serializers/getAssets';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import { ConfigT, SerializerConfigT } from 'metro-config';
import path from 'path';
import pathToRegExp from 'path-to-regexp';

import { buildHermesBundleAsync } from './exportHermes';
import { getExportPathForDependencyWithOptions } from './exportPath';
import {
  ExpoSerializerOptions,
  baseJSBundleWithDependencies,
  getBaseUrlOption,
  getPlatformOption,
  getSplitChunksOption,
} from './fork/baseJSBundle';
import { getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';

type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;

type SerializerParameters = Parameters<Serializer>;

type ChunkSettings = {
  /** Match the initial modules. */
  test: RegExp;
};

export type SerializeChunkOptions = {
  includeSourceMaps: boolean;
  includeBytecode: boolean;
};

export async function graphToSerialAssetsAsync(
  config: MetroConfig,
  serializeChunkOptions: SerializeChunkOptions,
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

  const jsAssets = await serializeChunksAsync(
    _chunks,
    config.serializer ?? {},
    serializeChunkOptions
  );

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
    public options: ExpoSerializerOptions,
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
        baseUrl: getBaseUrlOption(this.graph, this.options),
        splitChunks: getSplitChunksOption(this.graph, this.options),
      }
    );

    return bundleToString(jsSplitBundle).code;
  }

  async serializeToAssetsAsync(
    serializerConfig: Partial<SerializerConfigT>,
    {
      includeSourceMaps,
      includeBytecode,
    }: { includeSourceMaps?: boolean; includeBytecode?: boolean }
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

    if (includeBytecode && this.isHermesEnabled()) {
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

  private supportsBytecode() {
    return this.getPlatform() !== 'web';
  }

  isHermesEnabled() {
    // TODO: Revisit.
    // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
    // also create hermes bytecode. We may need to disable in one of the two places.
    return (
      !this.options.dev &&
      this.supportsBytecode() &&
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
    // On native, use the preModules in insert code in the entry chunk.
    for (const module of preModules.values()) {
      entryChunk.preModules.add(module);
    }
  }

  chunks.add(entryChunk);

  function includeModule(entryModule: Module<MixedOutput>) {
    for (const dependency of entryModule.dependencies.values()) {
      // TODO: Create more chunks
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

  for (const entryModule of entryModules) {
    includeModule(entryModule);
  }

  return chunks;
}

async function serializeChunksAsync(
  chunks: Set<Chunk>,
  serializerConfig: Partial<SerializerConfigT>,
  { includeSourceMaps, includeBytecode }: SerializeChunkOptions
) {
  const jsAssets: SerialAsset[] = [];

  await Promise.all(
    [...chunks].map(async (chunk) => {
      jsAssets.push(
        ...(await chunk.serializeToAssetsAsync(serializerConfig, {
          includeSourceMaps,
          includeBytecode,
        }))
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
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort(
    (a: Module<any>, b: Module<any>) => createModuleId(a.path) - createModuleId(b.path)
  );
}
