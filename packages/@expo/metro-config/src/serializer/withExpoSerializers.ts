/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import { isJscSafeUrl, toNormalUrl } from 'jsc-safe-url';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
// @ts-expect-error
import sourceMapString from 'metro/src/DeltaBundler/Serializers/sourceMapString';
import bundleToString from 'metro/src/lib/bundleToString';
import { ConfigT, InputConfigT, SerializerConfigT } from 'metro-config';
import path from 'path';

// import { toFixture } from './__tests__/fixtures/toFixture';
import {
  environmentVariableSerializerPlugin,
  serverPreludeSerializerPlugin,
} from './environmentVariableSerializerPlugin';
import { baseJSBundle, baseJSBundleWithDependencies } from './fork/baseJSBundle';
import { getExportPathForDependency, getExportPathForDependencyWithOptions } from './fork/js';
import { fileNameFromContents, getCssSerialAssets } from './getCssDeps';
import { SerialAsset } from './serializerAssets';
import { env } from '../env';

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
        // @ts-expect-error
        config.serializer ?? {},
        processors,
        originalSerializer
      ),
    },
  };
}
export function getDefaultSerializer(
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

    // const jsCode = await defaultSerializer(entryFile, preModules, graph, options);

    // toFixture(...props);
    if (!options.sourceUrl) {
      return defaultSerializer(...props);
    }

    const sourceUrl = isJscSafeUrl(options.sourceUrl)
      ? toNormalUrl(options.sourceUrl)
      : options.sourceUrl;
    const url = new URL(sourceUrl, 'https://expo.dev');

    if (!graph.transformOptions.platform) {
      // @ts-expect-error
      graph.transformOptions.platform = url.searchParams.get('platform');
    }

    if (
      graph.transformOptions.platform !== 'web' ||
      url.searchParams.get('serializer.output') !== 'static'
    ) {
      // Default behavior if `serializer.output=static` is not present in the URL.
      return defaultSerializer(...props);
    }

    const chunks:
      | {
          // Leaf file-path.
          name: string;
          // Relative file paths.
          inputs: string[];
        }[]
      | null = url.searchParams.has('serializer.chunks')
      ? JSON.parse(url.searchParams.get('serializer.chunks')!)
      : null;

    const allEntryFiles = new Set([
      // Entry file for all chunks.
      entryFile,
      // Entry files for each chunk.
      ...(chunks?.map((chunk) => chunk.inputs) ?? []).flat(),
    ]);

    console.log('process chunks:', entryFile, chunks, allEntryFiles);

    const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';

    const cssDeps = getCssSerialAssets<MixedOutput>(graph.dependencies, {
      projectRoot: options.projectRoot,
      processModuleFilter: options.processModuleFilter,
    });

    // JS

    const _chunks = gatherChunks(new Set(), entryFile, preModules, graph, options);

    // Optimize the chunks
    dedupeChunks(_chunks);

    const jsAssets = serializeChunks(_chunks, serializerConfig);

    return JSON.stringify([...jsAssets, ...cssDeps]);
  };
}

class Chunk {
  public deps: Set<Module> = new Set();
  public preModules: Set<Module> = new Set();

  // Chunks that are required to be loaded synchronously before this chunk.
  // These are included in the HTML as <script> tags.
  public requiredChunks: Set<Chunk> = new Set();

  constructor(
    public name: string,
    public entry: string,
    public graph: ReadOnlyGraph<MixedOutput>,
    public options: SerializerOptions<MixedOutput>,
    public isAsync: boolean = false
  ) {}

  getFilename() {
    assert(
      this.graph.transformOptions.platform,
      "platform is required to be in graph's transformOptions"
    );
    // TODO: Content hash is needed
    return this.options.dev
      ? this.entry
      : getExportPathForDependencyWithOptions(this.entry, {
          platform: this.graph.transformOptions.platform,
          serverRoot: this.options.serverRoot,
        });
  }

  serializeToCode(serializerConfig: SerializerConfigT) {
    const entryFile = this.entry;
    const fileName = path.basename(entryFile, '.js');

    const jsSplitBundle = baseJSBundleWithDependencies(
      entryFile,
      [...this.preModules.values()],
      [...this.deps],
      {
        ...this.options,
        runBeforeMainModule: serializerConfig.getModulesRunBeforeMainModule(
          path.relative(this.options.projectRoot, entryFile)
        ),
        // ...(entryFile === '[vendor]'
        //   ? {
        //       runModule: false,
        //       modulesOnly: true,
        //       runBeforeMainModule: [],
        //     }
        //   : {}),
        sourceMapUrl: `${fileName}.js.map`,
      }
    );

    return bundleToString(jsSplitBundle).code;
  }

  serializeToAsset(serializerConfig: SerializerConfigT): SerialAsset {
    const jsCode = this.serializeToCode(serializerConfig);

    // console.log('-- code:', jsCode);
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

    // console.log('entry >', entryDependency, entryDependency.dependencies);
    const relativeEntry = path.relative(this.options.projectRoot, this.entry);
    const outputFile = this.getFilename();

    return {
      filename: outputFile,
      originFilename: relativeEntry,
      type: 'js',
      metadata: {
        requires: [...this.requiredChunks.values()].map((chunk) => chunk.getFilename()),
      },
      source: jsCode,
    };
  }
}

function gatherChunks(
  chunks: Set<Chunk>,
  entryFile: string,
  preModules: readonly Module[],
  graph: ReadOnlyGraph,
  options: SerializerOptions<MixedOutput>,
  isAsync: boolean = false
): Set<Chunk> {
  const entryModule = graph.dependencies.get(entryFile);
  if (!entryModule) {
    throw new Error('Entry module not found in graph: ' + entryFile);
  }

  // Prevent processing the same entry file twice.
  if ([...chunks.values()].find((chunk) => chunk.entry === entryFile)) {
    return chunks;
  }

  const entryChunk = new Chunk(entryFile, entryFile, graph, options, isAsync);

  // Add all the pre-modules to the first chunk.
  if (preModules.length) {
    if (graph.transformOptions.platform === 'web' && !isAsync) {
      // On web, add a new required chunk that will be included in the HTML.
      const preChunk = new Chunk('__premodules__', '__premodules__', graph, options);
      for (const module of preModules.values()) {
        preChunk.deps.add(module);
      }
      chunks.add(preChunk);
      entryChunk.requiredChunks.add(preChunk);
    } else {
      // On native, use the preModules in insert code in the entry chunk.
      for (const module of preModules.values()) {
        entryChunk.preModules.add(module);
      }
    }
  }

  chunks.add(entryChunk);

  entryChunk.deps.add(entryModule);
  for (const dependency of entryModule.dependencies.values()) {
    if (dependency.data.data.asyncType === 'async') {
      gatherChunks(chunks, dependency.absolutePath, [], graph, options, true);
    } else {
      const module = graph.dependencies.get(dependency.absolutePath);
      if (module) {
        entryChunk.deps.add(module);
      }
    }
  }

  return chunks;
}

function dedupeChunks(chunks: Set<Chunk>) {
  // Iterate chunks and pull duplicate modules into new common chunks that are required by the original chunks.

  // We can only de-dupe sync chunks since this would create vendor/shared chunks.
  const currentChunks = [...chunks.values()].filter((chunk) => !chunk.isAsync);
  for (const chunk of currentChunks) {
    const deps = [...chunk.deps.values()];
    for (const dep of deps) {
      for (const otherChunk of currentChunks) {
        if (otherChunk === chunk) {
          continue;
        }
        if (otherChunk.deps.has(dep)) {
          console.log('found common dep:', dep.path, 'in', chunk.name, 'and', otherChunk.name);
          // Move the dep into a new chunk.
          const newChunk = new Chunk(dep.path, dep.path, chunk.graph, chunk.options, false);
          newChunk.deps.add(dep);
          chunk.requiredChunks.add(newChunk);
          otherChunk.requiredChunks.add(newChunk);
          chunks.add(newChunk);
          // Remove the dep from the original chunk.
          chunk.deps.delete(dep);
          otherChunk.deps.delete(dep);

          // TODO: Pull all the deps of the dep into the new chunk.
          for (const depDep of dep.dependencies.values()) {
            if (depDep.data.data.asyncType === 'async') {
              gatherChunks(chunks, depDep.absolutePath, [], chunk.graph, chunk.options, false);
            } else {
              const module = chunk.graph.dependencies.get(depDep.absolutePath);
              if (module) {
                newChunk.deps.add(module);
                if (chunk.deps.has(module)) {
                  chunk.deps.delete(module);
                }
                if (otherChunk.deps.has(module)) {
                  otherChunk.deps.delete(module);
                }
              }
            }
          }
        }
      }
    }
  }
}

function serializeChunks(chunks: Set<Chunk>, serializerConfig: SerializerConfigT) {
  const jsAssets: SerialAsset[] = [];

  chunks.forEach((chunk) => {
    jsAssets.push(chunk.serializeToAsset(serializerConfig));
  });

  return jsAssets;
}

function getSortedModules(
  graph: SerializerParameters[2],
  {
    createModuleId,
  }: {
    createModuleId: (path: string) => number;
  }
): readonly Module<any>[] {
  const modules = [...graph.dependencies.values()];
  // Assign IDs to modules in a consistent order
  for (const module of modules) {
    createModuleId(module.path);
  }
  // Sort by IDs
  return modules.sort(
    (a: Module<any>, b: Module<any>) => createModuleId(a.path) - createModuleId(b.path)
  );
}

function serializeToSourceMap(...props: SerializerParameters): string {
  const [, prepend, graph, options] = props;

  const modules = [
    ...prepend,
    ...getSortedModules(graph, {
      createModuleId: options.createModuleId,
    }),
  ];

  return sourceMapString(modules, {
    ...options,
  });
}

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
