import type { SerializerConfigT } from '@expo/metro/metro-config';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import bundleToString from '@expo/metro/metro/lib/bundleToString';
import assert from 'assert';
import path from 'path';

import { stringToUUID } from '../debugId';
import { getExportPathForDependencyWithOptions } from '../exportPath';
import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import { transformJsAssetToHermesBytecodeAsync } from '../hermesArtifacts';
import { serializeJavaScriptArtifactsAsync } from '../serializeJavaScriptArtifacts';
import type { SerialAsset } from '../serializerAssets';
import { getSourceMapOptions, sourceMapStringNonBlocking } from '../sourceMap';
import type {
  ChunkingImplementation,
  ChunkSerializationOptions,
  SerializeChunkOptions,
} from './chunkingStrategy';

let _baseJSBundleWithDependencies: typeof import('../fork/baseJSBundle').baseJSBundleWithDependencies;
function getBaseJSBundleWithDependencies() {
  if (!_baseJSBundleWithDependencies) {
    _baseJSBundleWithDependencies = require('../fork/baseJSBundle').baseJSBundleWithDependencies;
  }
  return _baseJSBundleWithDependencies;
}

let _getBaseUrlOption: typeof import('../fork/baseJSBundle').getBaseUrlOption;
export function getBaseUrlOption(
  ...args: Parameters<typeof import('../fork/baseJSBundle').getBaseUrlOption>
) {
  if (!_getBaseUrlOption) {
    _getBaseUrlOption = require('../fork/baseJSBundle').getBaseUrlOption;
  }
  return _getBaseUrlOption(...args);
}

let _getPlatformOption: typeof import('../fork/baseJSBundle').getPlatformOption;
export function getPlatformOption(
  ...args: Parameters<typeof import('../fork/baseJSBundle').getPlatformOption>
) {
  if (!_getPlatformOption) {
    _getPlatformOption = require('../fork/baseJSBundle').getPlatformOption;
  }
  return _getPlatformOption(...args);
}

export class Chunk {
  public deps: Set<Module> = new Set();
  public preModules: Set<Module> = new Set();

  // Chunks that are required to be loaded synchronously before this chunk.
  // These are included in the HTML as <script> tags.
  public requiredChunks: Set<Chunk> = new Set();

  /** Whether this chunk owns an isolated module registry and must retain all of its dependencies.
   * @remarks
   * When a chunk is sealed, its `deps` and `preModules` shouldn't be altered, and it doesn't qualify
   * for bundle/chunk splitting. This is the case for web workers, which must form a "closed" and
   * self-sufficient entry bundle.
   */
  public sealed = false;

  constructor(
    public name: string,
    public entries: Set<Module<MixedOutput>>,
    public graph: ReadOnlyGraph<MixedOutput>,
    public options: ExpoSerializerOptions,
    private readonly strategy: Omit<ChunkingImplementation, 'serializeAsync'>,
    public isAsync: boolean = false,
    public isVendor: boolean = false,
    public isEntry: boolean = false
  ) {
    this.deps = new Set(entries);
  }

  seal(): void {
    this.sealed = true;
  }

  private getPlatform() {
    const platform = getPlatformOption(this.graph, this.options);
    assert(platform, "platform is required to be in graph's transformOptions");
    return platform;
  }

  getFilename(src: string) {
    return !this.options.serializerOptions?.exporting
      ? this.name
      : getExportPathForDependencyWithOptions(this.name, {
          platform: this.getPlatform(),
          src,
          serverRoot: this.options.serverRoot,
        });
  }

  getStableChunkSource(serializerConfig: Partial<SerializerConfigT>) {
    return this.options.dev
      ? ''
      : this.serializeToCode(serializerConfig, {
          // Disable source maps when creating a sha to reduce the number of possible changes that could
          // influence the cache hit.
          serializerOptions: {
            includeSourceMaps: false,
          },
          sourceMapUrl: undefined,
          debugId: undefined,
        }).code;
  }

  serializeToCode(
    serializerConfig: Partial<SerializerConfigT>,
    options: ChunkSerializationOptions & {
      preModules?: Iterable<Module>;
    } = {}
  ) {
    const entryFile = this.name;

    // TODO: Disable all debugId steps when a dev server is enabled. This is an export-only feature.

    const preModules = [...(options.preModules ?? this.preModules)];
    const dependencies = [...this.deps];

    const jsSplitBundle = getBaseJSBundleWithDependencies()(entryFile, preModules, dependencies, {
      ...this.options,
      sourceMapOptions: getSourceMapOptions(this.options, this.isServer),
      runBeforeMainModule:
        options.runBeforeMainModule ??
        serializerConfig?.getModulesRunBeforeMainModule?.(
          path.relative(this.options.projectRoot, entryFile)
        ) ??
        [],
      runModule: this.options.runModule && !this.isVendor && (this.isEntry || !this.isAsync),
      modulesOnly: this.options.modulesOnly || preModules.length === 0,
      platform: this.getPlatform(),
      baseUrl: getBaseUrlOption(this.graph, this.options),
      splitChunks: !!this.options.serializerOptions?.splitChunks,
      computedAsyncModulePaths: null,
      ...this.strategy.getStableSerializationOptions(this),
      ...options,
    });

    return { code: bundleToString(jsSplitBundle).code, paths: jsSplitBundle.paths };
  }

  async serializeToSourceMapAsync(
    preModules: Iterable<Module> = this.preModules,
    debugId?: string
  ): Promise<string> {
    const modules = [
      ...(this.options.modulesOnly ? [] : preModules),
      ...getSortedModules([...this.deps], this.options),
    ];
    return sourceMapStringNonBlocking(modules, {
      ...getSourceMapOptions(this.options, this.isServer),
      debugId,
    });
  }

  hasAbsolutePath(absolutePath: string): boolean {
    for (const dep of this.deps) {
      if (dep.path === absolutePath) {
        return true;
      }
    }
    return false;
  }

  private _asyncTargets?: Set<Chunk>;

  getAsyncChunkTargets(chunksByPath: Map<string, Chunk>): Set<Chunk> {
    return (this._asyncTargets ??= this.strategy.getAsyncChunkTargets(this, chunksByPath));
  }

  private get isServer(): boolean {
    const environment = this.graph.transformOptions.customTransformOptions?.environment;
    return environment === 'node' || environment === 'react-server';
  }

  private getAdjustedSourceMapUrl(filename: string): string | null {
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

  private boolishTransformOption(name: string) {
    const value = this.graph.transformOptions?.customTransformOptions?.[name];
    return value === true || value === 'true' || value === '1';
  }

  async serializeToAssetsAsync(
    serializerConfig: Partial<SerializerConfigT>,
    chunksByPath: Map<string, Chunk>,
    filenamesByChunk: Map<Chunk, string>,
    { includeSourceMaps, unstable_beforeAssetSerializationPlugins }: SerializeChunkOptions
  ): Promise<SerialAsset[]> {
    const outputFile = filenamesByChunk.get(this);
    assert(outputFile, 'Precomputed filename missing for chunk: ' + this.name);
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

    const preModules = new Set(finalPreModules);
    const assets = await serializeJavaScriptArtifactsAsync({
      includeSourceMaps: includeSourceMaps && !!this.options.sourceMapUrl,
      inlineSourceMap: !!this.options.inlineSourceMap,
      sourceMapUrl: this.getAdjustedSourceMapUrl(outputFile),
      debugId,
      getSourceMap: async () => ({
        source: await this.serializeToSourceMapAsync(
          this.options.inlineSourceMap ? preModules : finalPreModules,
          this.options.inlineSourceMap ? this.options.debugId : debugId
        ),
      }),
      artifact: (annotations) => {
        const jsCode = this.serializeToCode(serializerConfig, {
          ...annotations,
          preModules,
          // Inline map data is already prepared; emit its URL through Metro's annotation modules.
          ...(this.options.inlineSourceMap
            ? {
                inlineSourceMap: false,
                serializerOptions: { ...this.options.serializerOptions, includeSourceMaps: true },
              }
            : {}),
          ...this.strategy.getSerializationOptions(this, chunksByPath, filenamesByChunk),
        });
        const { modulePaths, ...chunkMetadata } = this.strategy.getMetadata(this, filenamesByChunk);
        return {
          filename: outputFile,
          originFilename: path.relative(this.options.projectRoot, this.name),
          type: 'js',
          metadata: {
            ...chunkMetadata,
            isAsync: this.isAsync,
            requires: [...this.requiredChunks.values()].map((chunk) => {
              const filename = filenamesByChunk.get(chunk);
              assert(filename, 'Precomputed filename missing for required chunk: ' + chunk.name);
              return filename;
            }),
            // Provide a list of module paths that can be used for matching chunks to routes.
            // TODO: Move HTML serializing closer to this code so we can reduce passing this much data around.
            modulePaths,
            paths: jsCode.paths,
            expoDomComponentReferences: collectOutputReferences(
              this.deps,
              'expoDomComponentReference'
            ),
            reactClientReferences: collectOutputReferences(this.deps, 'reactClientReference'),
            reactServerReferences: collectOutputReferences(this.deps, 'reactServerReference'),
            loaderReferences: collectOutputReferences(this.deps, 'loaderReference'),
          },
          source: jsCode.code,
        };
      },
    });
    const jsAsset = assets[0]!;

    if (
      this.boolishTransformOption('bytecode') &&
      this.isHermesEnabled() &&
      !jsAsset.metadata.expoDomComponentReferences?.length
    ) {
      await transformJsAssetToHermesBytecodeAsync(this.options.projectRoot, jsAsset, assets[1]);
    }

    return assets;
  }

  private supportsBytecode() {
    return this.getPlatform() !== 'web';
  }

  isHermesEnabled() {
    return (
      !this.options.dev &&
      this.supportsBytecode() &&
      this.graph.transformOptions.customTransformOptions?.engine === 'hermes'
    );
  }
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

function collectOutputReferences(modules: Iterable<Module>, key: string): string[] {
  return [
    ...new Set(
      [...modules]
        .map((module) => {
          return module.output.map((output) => {
            // TODO: This is a mess. This needs to be properly typed
            const data = output.data as any;
            if (key in data && typeof data[key] === 'string') {
              return data[key];
            }
            return undefined;
          });
        })
        .flat()
    ),
  ].filter((value): value is string => typeof value === 'string');
}
