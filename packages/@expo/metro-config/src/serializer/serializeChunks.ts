/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig, AssetData } from '@expo/metro/metro';
import sourceMapStringMod from '@expo/metro/metro/DeltaBundler/Serializers/sourceMapString';
import type {
  MixedOutput,
  Module,
  ReadOnlyGraph,
  SerializerOptions,
} from '@expo/metro/metro/DeltaBundler/types.flow';
import bundleToString from '@expo/metro/metro/lib/bundleToString';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';
import type { ConfigT, SerializerConfigT } from '@expo/metro/metro-config';
import assert from 'assert';
import path from 'path';

import { stringToUUID } from './debugId';
import { buildHermesBundleAsync } from './exportHermes';
import { getExportPathForDependencyWithOptions } from './exportPath';
import {
  ExpoSerializerOptions,
  baseJSBundleWithDependencies,
  getBaseUrlOption,
  getPlatformOption,
} from './fork/baseJSBundle';
import { getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { SerializerConfigOptions } from './withExpoSerializers';
import getMetroAssets from '../transform-worker/getAssets';
import { toPosixPath } from '../utils/filePath';

type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;

type ChunkSettings = {
  /** Match the initial modules. */
  test: RegExp;
};

export type SerializeChunkOptions = {
  includeSourceMaps: boolean;
  splitChunks: boolean;
} & SerializerConfigOptions;

// Convert file paths to regex matchers.
function pathToRegex(path: string) {
  // Escape regex special characters, except for '*'
  let regexSafePath = path.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');

  // Replace '*' with '.*' to act as a wildcard in regex
  regexSafePath = regexSafePath.replace(/\*/g, '.*');

  // Create a RegExp object with the modified string
  return new RegExp('^' + regexSafePath + '$');
}

const sourceMapString =
  typeof sourceMapStringMod !== 'function'
    ? sourceMapStringMod.sourceMapString
    : sourceMapStringMod;

export async function graphToSerialAssetsAsync(
  config: MetroConfig,
  serializeChunkOptions: SerializeChunkOptions,
  ...props: SerializerParameters
): Promise<{
  artifacts: SerialAsset[] | null;
  assets: AssetData[];
}> {
  const [entryFile, preModules, graph, options] = props;

  const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
    entryFile,
    projectRoot: options.projectRoot,
  });

  // Create chunks for splitting.
  const chunks = new Set<Chunk>();

  [
    {
      test: pathToRegex(entryFile),
    },
  ].map((chunkSettings) =>
    gatherChunks(preModules, chunks, chunkSettings, preModules, graph, options, false, true)
  );

  const entryChunk = [...chunks.values()].find(
    (chunk) => !chunk.isAsync && chunk.hasAbsolutePath(entryFile)
  );

  if (entryChunk) {
    for (const chunk of chunks.values()) {
      if (!chunk.isEntry && chunk.isAsync) {
        for (const dep of chunk.deps.values()) {
          if (entryChunk.deps.has(dep)) {
            // Remove the dependency from the async chunk since it will be loaded in the main chunk.
            chunk.deps.delete(dep);
          }
        }
      }
    }

    const toCompare = [...chunks.values()];

    const commonDependencies = [];

    while (toCompare.length) {
      const chunk = toCompare.shift()!;
      for (const chunk2 of toCompare) {
        if (chunk !== chunk2 && chunk.isAsync && chunk2.isAsync) {
          const commonDeps = [...chunk.deps].filter((dep) => chunk2.deps.has(dep));

          for (const dep of commonDeps) {
            chunk.deps.delete(dep);
            chunk2.deps.delete(dep);
          }

          commonDependencies.push(...commonDeps);
        }
      }
    }

    let commonChunk: Chunk | undefined;
    // If common dependencies were found, extract them to the shared chunk.
    if (commonDependencies.length) {
      const commonDependenciesUnique = [...new Set(commonDependencies)];
      commonChunk = new Chunk(
        '/__common.js',
        commonDependenciesUnique,
        graph,
        options,
        false,
        true
      );
      entryChunk.requiredChunks.add(commonChunk);
      chunks.add(commonChunk);
    }

    // TODO: Optimize this pass more.
    // Remove all dependencies from async chunks that are already in the common chunk.
    for (const chunk of [...chunks.values()]) {
      if (!chunk.isEntry && chunk !== commonChunk) {
        for (const dep of chunk.deps) {
          if (entryChunk.deps.has(dep) || commonChunk?.deps.has(dep)) {
            chunk.deps.delete(dep);
          }
        }
      }
    }

    // Remove empty chunks
    for (const chunk of [...chunks.values()]) {
      if (!chunk.isEntry && chunk.deps.size === 0) {
        chunks.delete(chunk);
      }
    }

    // Create runtime chunk
    if (commonChunk) {
      const runtimeChunk = new Chunk('/__expo-metro-runtime.js', [], graph, options, false, true);

      // All premodules (including metro-runtime) should load first
      for (const preModule of entryChunk.preModules) {
        runtimeChunk.preModules.add(preModule);
      }
      entryChunk.preModules = new Set();

      for (const chunk of chunks) {
        // Runtime chunk has to load before any other a.k.a all chunks require it.
        chunk.requiredChunks.add(runtimeChunk);
      }
      chunks.add(runtimeChunk);
    }
  }

  const jsAssets = await serializeChunksAsync(
    chunks,
    config.serializer ?? {},
    serializeChunkOptions
  );

  // TODO: Can this be anything besides true?
  const isExporting = true;
  const baseUrl = getBaseUrlOption(graph, { serializerOptions: serializeChunkOptions });
  const assetPublicUrl = (baseUrl.replace(/\/+$/, '') ?? '') + '/assets';
  const platform = getPlatformOption(graph, options) ?? 'web';
  const isHosted =
    platform === 'web' || (graph.transformOptions?.customTransformOptions?.hosted && isExporting);
  const publicPath = isExporting
    ? isHosted
      ? `/assets?export_path=${assetPublicUrl}`
      : assetPublicUrl
    : '/assets/?unstable_path=.';

  // TODO: Convert to serial assets
  // TODO: Disable this call dynamically in development since assets are fetched differently.
  const metroAssets = (await getMetroAssets(graph.dependencies, {
    processModuleFilter: options.processModuleFilter,
    assetPlugins: config.transformer?.assetPlugins ?? [],
    platform,
    projectRoot: options.projectRoot, // this._getServerRootDir(),
    publicPath,
    isHosted,
  })) as AssetData[];

  return {
    artifacts: [...jsAssets, ...cssDeps],
    assets: metroAssets,
  };
}

export class Chunk {
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
    public isAsync: boolean = false,
    public isVendor: boolean = false,
    public isEntry: boolean = false
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

  private getFilename(src: string) {
    return !this.options.serializerOptions?.exporting
      ? this.name
      : getExportPathForDependencyWithOptions(this.name, {
          platform: this.getPlatform(),
          src,
          serverRoot: this.options.serverRoot,
        });
  }

  private getStableChunkSource(serializerConfig: Partial<SerializerConfigT>) {
    return this.options.dev
      ? ''
      : this.serializeToCodeWithTemplates(serializerConfig, {
          // Disable source maps when creating a sha to reduce the number of possible changes that could
          // influence the cache hit.
          serializerOptions: {
            includeSourceMaps: false,
          },
          sourceMapUrl: undefined,
          debugId: undefined,
        }).code;
  }

  private getFilenameForConfig(serializerConfig: Partial<SerializerConfigT>) {
    return this.getFilename(this.getStableChunkSource(serializerConfig));
  }

  private serializeToCodeWithTemplates(
    serializerConfig: Partial<SerializerConfigT>,
    options: Partial<Parameters<typeof baseJSBundleWithDependencies>[3]> & {
      preModules?: Set<Module>;
    } = {}
  ) {
    const entryFile = this.name;

    // TODO: Disable all debugId steps when a dev server is enabled. This is an export-only feature.

    const preModules = [...(options.preModules ?? this.preModules).values()];
    const dependencies = [...this.deps];

    const jsSplitBundle = baseJSBundleWithDependencies(entryFile, preModules, dependencies, {
      ...this.options,
      runBeforeMainModule:
        serializerConfig?.getModulesRunBeforeMainModule?.(
          path.relative(this.options.projectRoot, entryFile)
        ) ?? [],
      runModule: this.options.runModule && !this.isVendor && (this.isEntry || !this.isAsync),
      modulesOnly: this.options.modulesOnly || preModules.length === 0,
      platform: this.getPlatform(),
      baseUrl: getBaseUrlOption(this.graph, this.options),
      splitChunks: !!this.options.serializerOptions?.splitChunks,
      skipWrapping: true,
      computedAsyncModulePaths: null,
      ...options,
    });

    return { code: bundleToString(jsSplitBundle).code, paths: jsSplitBundle.paths };
  }

  hasAbsolutePath(absolutePath: string): boolean {
    return [...this.deps].some((module) => module.path === absolutePath);
  }

  private getComputedPathsForAsyncDependencies(
    serializerConfig: Partial<SerializerConfigT>,
    chunks: Chunk[]
  ) {
    const baseUrl = getBaseUrlOption(this.graph, this.options);
    // Only calculate production paths when all chunks are being exported.
    if (this.options.includeAsyncPaths) {
      return null;
    }
    const computedAsyncModulePaths: Record<string, string> = {};

    this.deps.forEach((module) => {
      module.dependencies.forEach((dependency) => {
        if (isResolvedDependency(dependency) && dependency.data.data.asyncType) {
          const chunkContainingModule = chunks.find((chunk) =>
            chunk.hasAbsolutePath(dependency.absolutePath)
          );
          assert(
            chunkContainingModule,
            'Chunk containing module not found: ' + dependency.absolutePath
          );

          // NOTE(kitten): We shouldn't have any async imports on non-async chunks
          // However, due to how chunks merge, some async imports may now be pointing
          // at entrypoint (or vendor) chunks. We omit the path so that the async import
          // helper doesn't reload and reevaluate the entrypoint.
          if (chunkContainingModule.isAsync) {
            const moduleIdName = chunkContainingModule.getFilenameForConfig(serializerConfig);
            computedAsyncModulePaths![dependency.absolutePath] = (baseUrl ?? '/') + moduleIdName;
          }
        }
      });
    });
    return computedAsyncModulePaths;
  }

  private getAdjustedSourceMapUrl(serializerConfig: Partial<SerializerConfigT>): string | null {
    // Metro really only accounts for development, so we'll use the defaults here.
    if (this.options.dev) {
      return this.options.sourceMapUrl ?? null;
    }

    if (this.options.serializerOptions?.includeSourceMaps !== true) {
      return null;
    }

    if (this.options.inlineSourceMap || !this.options.sourceMapUrl) {
      return this.options.sourceMapUrl ?? null;
    }

    const platform = this.getPlatform();
    const isAbsolute = platform !== 'web';

    const baseUrl = getBaseUrlOption(this.graph, this.options);
    const filename = this.getFilenameForConfig(serializerConfig);
    const isAbsoluteBaseUrl = !!baseUrl?.match(/https?:\/\//);
    const pathname =
      (isAbsoluteBaseUrl ? '' : baseUrl.replace(/\/+$/, '')) +
      '/' +
      filename.replace(/^\/+$/, '') +
      '.map';

    let adjustedSourceMapUrl = this.options.sourceMapUrl;

    // Metro has lots of issues...
    if (this.options.sourceMapUrl.startsWith('//localhost')) {
      adjustedSourceMapUrl = 'http:' + this.options.sourceMapUrl;
    }

    try {
      const parsed = new URL(pathname, isAbsoluteBaseUrl ? baseUrl : adjustedSourceMapUrl);

      if (isAbsoluteBaseUrl || isAbsolute) {
        return parsed.href;
      }

      return parsed.pathname;
    } catch (error) {
      // NOTE: export:embed that don't use baseUrl will use file paths instead of URLs.
      if (!this.options.dev && isAbsolute) {
        return adjustedSourceMapUrl;
      }
      console.error(
        `Failed to link source maps because the source map URL "${this.options.sourceMapUrl}" is corrupt:`,
        error
      );
      return null;
    }
  }

  private serializeToCode(
    serializerConfig: Partial<SerializerConfigT>,
    { debugId, chunks, preModules }: { debugId: string; chunks: Chunk[]; preModules: Set<Module> }
  ) {
    return this.serializeToCodeWithTemplates(serializerConfig, {
      skipWrapping: false,
      sourceMapUrl: this.getAdjustedSourceMapUrl(serializerConfig) ?? undefined,
      computedAsyncModulePaths: this.getComputedPathsForAsyncDependencies(serializerConfig, chunks),
      debugId,
      preModules,
    });
  }

  private boolishTransformOption(name: string) {
    const value = this.graph.transformOptions?.customTransformOptions?.[name];
    return value === true || value === 'true' || value === '1';
  }

  async serializeToAssetsAsync(
    serializerConfig: Partial<SerializerConfigT>,
    chunks: Chunk[],
    { includeSourceMaps, unstable_beforeAssetSerializationPlugins }: SerializeChunkOptions
  ): Promise<SerialAsset[]> {
    // Create hash without wrapping to prevent it changing when the wrapping changes.
    const outputFile = this.getFilenameForConfig(serializerConfig);
    // We already use a stable hash for the output filename, so we'll reuse that for the debugId.
    const debugId = stringToUUID(path.basename(outputFile, path.extname(outputFile)));

    let finalPreModules = [...this.preModules];
    if (unstable_beforeAssetSerializationPlugins) {
      for (const plugin of unstable_beforeAssetSerializationPlugins) {
        finalPreModules = plugin({
          graph: this.graph,
          premodules: finalPreModules,
          debugId,
        });
      }
    }

    const jsCode = this.serializeToCode(serializerConfig, {
      chunks,
      debugId,
      preModules: new Set(finalPreModules),
    });

    const relativeEntry = path.relative(this.options.projectRoot, this.name);

    const jsAsset: SerialAsset = {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        isAsync: this.isAsync,
        requires: [...this.requiredChunks.values()].map((chunk) =>
          chunk.getFilenameForConfig(serializerConfig)
        ),
        // Provide a list of module paths that can be used for matching chunks to routes.
        // TODO: Move HTML serializing closer to this code so we can reduce passing this much data around.
        modulePaths: [...this.deps].map((module) => module.path),
        paths: jsCode.paths,
        expoDomComponentReferences: [
          ...new Set(
            [...this.deps]
              .map((module) => {
                return module.output.map((output) => {
                  if (
                    'expoDomComponentReference' in output.data &&
                    typeof output.data.expoDomComponentReference === 'string'
                  ) {
                    return output.data.expoDomComponentReference;
                  }
                  return undefined;
                });
              })
              .flat()
          ),
        ].filter((value) => typeof value === 'string') as string[],
        reactClientReferences: [
          ...new Set(
            [...this.deps]
              .map((module) => {
                return module.output.map((output) => {
                  if (
                    'reactClientReference' in output.data &&
                    typeof output.data.reactClientReference === 'string'
                  ) {
                    return output.data.reactClientReference;
                  }
                  return undefined;
                });
              })
              .flat()
          ),
        ].filter((value) => typeof value === 'string') as string[],
        reactServerReferences: [
          ...new Set(
            [...this.deps]
              .map((module) => {
                return module.output.map((output) => {
                  if (
                    'reactServerReference' in output.data &&
                    typeof output.data.reactServerReference === 'string'
                  ) {
                    return output.data.reactServerReference;
                  }
                  return undefined;
                });
              })
              .flat()
          ),
        ].filter((value) => typeof value === 'string') as string[],
      },
      source: jsCode.code,
    };

    const assets: SerialAsset[] = [jsAsset];

    const mutateSourceMapWithDebugId = (sourceMap: string) => {
      // TODO: Upstream this so we don't have to parse the source map back and forth.
      if (!debugId) {
        return sourceMap;
      }
      // NOTE: debugId isn't required for inline source maps because the source map is included in the same file, therefore
      // we don't need to disambiguate between multiple source maps.
      const sourceMapObject = JSON.parse(sourceMap);
      sourceMapObject.debugId = debugId;
      // NOTE: Sentry does this, but bun does not.
      // sourceMapObject.debug_id = debugId;
      return JSON.stringify(sourceMapObject);
    };

    if (
      // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
      includeSourceMaps &&
      !this.options.inlineSourceMap &&
      this.options.sourceMapUrl
    ) {
      const modules = [
        ...finalPreModules,
        ...getSortedModules([...this.deps], {
          createModuleId: this.options.createModuleId,
        }),
      ].map((module) => {
        // TODO: Make this user-configurable.

        // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
        if (path.isAbsolute(module.path)) {
          return {
            ...module,
            path:
              '/' +
              toPosixPath(
                path.relative(this.options.serverRoot ?? this.options.projectRoot, module.path)
              ),
          };
        }
        return module;
      });

      // TODO: We may not need to mutate the original source map with a `debugId` when hermes is enabled since we'll have different source maps.
      const sourceMap = mutateSourceMapWithDebugId(
        sourceMapString(modules, {
          excludeSource: false,
          ...this.options,
        })
      );

      assets.push({
        filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
        originFilename: jsAsset.originFilename,
        type: 'map',
        metadata: {},
        source: sourceMap,
      });
    }

    if (this.boolishTransformOption('bytecode') && this.isHermesEnabled()) {
      const adjustedSource = jsAsset.source.replace(
        /^\/\/# (sourceMappingURL)=(.*)$/gm,
        (...props) => {
          if (props[1] === 'sourceMappingURL') {
            const mapName = props[2].replace(/\.js\.map$/, '.hbc.map');
            return `//# ${props[1]}=` + mapName;
          }
          return '';
        }
      );

      // TODO: Generate hbc for each chunk
      const hermesBundleOutput = await buildHermesBundleAsync({
        projectRoot: this.options.projectRoot,
        filename: this.name,
        code: adjustedSource,
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

        // Replace mappings with hbc
        if (jsAsset.metadata.paths) {
          jsAsset.metadata.paths = Object.fromEntries(
            Object.entries(jsAsset.metadata.paths).map(([key, value]) => [
              key,
              Object.fromEntries(
                Object.entries(value).map(([key, value]) => [
                  key,
                  value ? value.replace(/\.js$/, '.hbc') : value,
                ])
              ),
            ])
          );
        }
      }
      if (assets[1] && hermesBundleOutput.sourcemap) {
        assets[1].source = mutateSourceMapWithDebugId(hermesBundleOutput.sourcemap);
        assets[1].filename = assets[1].filename.replace(/\.js\.map$/, '.hbc.map');
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
  runtimePremodules: readonly Module[],
  chunks: Set<Chunk>,
  settings: ChunkSettings,
  preModules: readonly Module[],
  graph: ReadOnlyGraph,
  options: SerializerOptions<MixedOutput>,
  isAsync: boolean = false,
  isEntry: boolean = false
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
    isAsync,
    false,
    isEntry
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
      if (!isResolvedDependency(dependency)) {
        continue;
      } else if (
        dependency.data.data.asyncType &&
        // Support disabling multiple chunks.
        entryChunk.options.serializerOptions?.splitChunks !== false
      ) {
        const isEntry = dependency.data.data.asyncType === 'worker';

        gatherChunks(
          runtimePremodules,
          chunks,
          { test: pathToRegex(dependency.absolutePath) },
          isEntry ? runtimePremodules : [],
          graph,
          options,
          true,
          isEntry
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

async function serializeChunksAsync(
  chunks: Set<Chunk>,
  serializerConfig: Partial<SerializerConfigT>,
  options: SerializeChunkOptions
) {
  const jsAssets: SerialAsset[] = [];

  const chunksArray = [...chunks.values()];
  await Promise.all(
    chunksArray.map(async (chunk) => {
      jsAssets.push(
        ...(await chunk.serializeToAssetsAsync(serializerConfig, chunksArray, options))
      );
    })
  );

  return jsAssets;
}

export function getSortedModules(
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
