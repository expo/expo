import type { SerializerConfigT } from '@expo/metro/metro-config';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import bundleToString from '@expo/metro/metro/lib/bundleToString';
import assert from 'assert';
import path from 'path';

import { toPosixPath } from '../../utils/filePath';
import { stringToUUID } from '../debugId';
import { getExportPathForDependencyWithOptions } from '../exportPath';
import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import type { SerialAsset } from '../serializerAssets';
import { appendDebugIdToSourceMap, sourceMapString } from '../sourceMap';
import type {
  ChunkingImplementation,
  ChunkSerializationOptions,
  SerializeChunkOptions,
} from './chunkingStrategy';

// Lazy-loaded to avoid pulling in metro-source-map at startup
let _buildHermesBundleAsync: typeof import('../exportHermes').buildHermesBundleAsync;
function getBuildHermesBundleAsync() {
  if (!_buildHermesBundleAsync) {
    _buildHermesBundleAsync = require('../exportHermes').buildHermesBundleAsync;
  }
  return _buildHermesBundleAsync;
}

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
    private readonly strategy: ChunkingImplementation,
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
    assert(
      this.graph.transformOptions.platform,
      "platform is required to be in graph's transformOptions"
    );
    return this.graph.transformOptions.platform;
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

  private serializeToCodeWithTemplates(
    serializerConfig: Partial<SerializerConfigT>,
    options: ChunkSerializationOptions & {
      preModules?: Set<Module>;
    } = {}
  ) {
    const entryFile = this.name;

    // TODO: Disable all debugId steps when a dev server is enabled. This is an export-only feature.

    const preModules = [...(options.preModules ?? this.preModules).values()];
    const dependencies = [...this.deps];

    const jsSplitBundle = getBaseJSBundleWithDependencies()(entryFile, preModules, dependencies, {
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
      ...this.strategy.getStableSerializationOptions(this),
      ...options,
    });

    return { code: bundleToString(jsSplitBundle).code, paths: jsSplitBundle.paths };
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

  private serializeToCode(
    serializerConfig: Partial<SerializerConfigT>,
    {
      debugId,
      chunksByPath,
      filenamesByChunk,
      filename,
      preModules,
    }: {
      debugId: string;
      chunksByPath: Map<string, Chunk>;
      filenamesByChunk: Map<Chunk, string>;
      filename: string;
      preModules: Set<Module>;
    }
  ) {
    return this.serializeToCodeWithTemplates(serializerConfig, {
      skipWrapping: false,
      sourceMapUrl: this.getAdjustedSourceMapUrl(filename) ?? undefined,
      debugId,
      preModules,
      ...this.strategy.getSerializationOptions(this, chunksByPath, filenamesByChunk),
    });
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
      chunksByPath,
      filenamesByChunk,
      filename: outputFile,
      debugId,
      preModules: new Set(finalPreModules),
    });

    const relativeEntry = path.relative(this.options.projectRoot, this.name);

    const { modulePaths, ...chunkMetadata } = this.strategy.getMetadata(this);
    const jsAsset: SerialAsset = {
      filename: outputFile,
      originFilename: relativeEntry,
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
        expoDomComponentReferences: collectOutputReferences(this.deps, 'expoDomComponentReference'),
        reactClientReferences: collectOutputReferences(this.deps, 'reactClientReference'),
        reactServerReferences: collectOutputReferences(this.deps, 'reactServerReference'),
        loaderReferences: collectOutputReferences(this.deps, 'loaderReference'),
      },
      source: jsCode.code,
    };

    const assets: SerialAsset[] = [jsAsset];

    // debugId is passed into `sourceMapString` so the bundler-map path
    // emits it inline rather than a JSON.parse + JSON.stringify
    // roundtrip; the Hermes branch below has to splice into a finished
    // JSON string because `buildHermesBundleAsync` is opaque.
    // NOTE: skipped for inline source maps since they don't need
    // disambiguation. We only emit `debugId` (Sentry also reads
    // `debug_id`, but bun doesn't).
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

      // TODO: We may not need to set `debugId` on the bundler sourcemap when
      // Hermes is enabled, since we ship a separate `.hbc.map` for that case.
      const sourceMap = sourceMapString(modules, {
        excludeSource: false,
        ...this.options,
        debugId,
      });

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
      const hermesBundleOutput = await getBuildHermesBundleAsync()({
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
        assets[1].source = debugId
          ? appendDebugIdToSourceMap(hermesBundleOutput.sourcemap, debugId)
          : hermesBundleOutput.sourcemap;
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
