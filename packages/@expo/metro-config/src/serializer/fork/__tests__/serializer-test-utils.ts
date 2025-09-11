import type { Module, MixedOutput } from '@expo/metro/metro/DeltaBundler';
import CountingSet from '@expo/metro/metro/lib/CountingSet';
import countLines from '@expo/metro/metro/lib/countLines';
import assert from 'assert';

import { microBundle, projectRoot } from './mini-metro';
import { reconcileTransformSerializerPlugin } from '../../reconcileTransformSerializerPlugin';
import { treeShakeSerializer } from '../../treeShakeSerializerPlugin';
import {
  SerialAsset,
  SerializerConfigOptions,
  SerializerPlugin,
  createSerializerFromSerialProcessors,
} from '../../withExpoSerializers';

// General helper to reduce boilerplate
export async function serializeToWithGraph(
  options: Partial<Parameters<typeof microBundle>[0]>,
  processors: SerializerPlugin[] = [],
  configOptions: SerializerConfigOptions = {}
) {
  const serializer = createSerializerFromSerialProcessors(
    {
      projectRoot,
    },
    processors,
    null, // originalSerializer
    configOptions
  );

  const fs = {
    'index.js': `
        console.log("hello");
      `,
  };

  const serial = await microBundle({
    fs,
    ...options,
  });

  const output = (await serializer(...serial)) as any;
  if (options.options?.output === 'static') {
    assert('artifacts' in output && Array.isArray(output.artifacts));
    return [serial, output.artifacts as SerialAsset[]];
  } else {
    return [serial, output];
  }
}

// General helper to reduce boilerplate
export async function serializeTo(
  options: Partial<Parameters<typeof microBundle>[0]>,
  processors: SerializerPlugin[] = [],
  configOptions: SerializerConfigOptions = {}
) {
  const [, output] = await serializeToWithGraph(options, processors, configOptions);
  return output;
}

// Serialize to a split bundle
export async function serializeSplitAsync(
  fs: Record<string, string>,
  options: Partial<Parameters<typeof microBundle>[0]['options']> = {},
  processors: SerializerPlugin[] = [],
  configOptions: SerializerConfigOptions = {},
  preModulesFs: Record<string, string> = {}
) {
  return await serializeTo(
    {
      fs,
      options: { platform: 'web', dev: false, output: 'static', splitChunks: true, ...options },
      preModulesFs,
    },
    processors,
    configOptions
  );
}

// Serialize to a split bundle
export async function serializeShakingAsync(
  fs: Record<string, string>,
  options: {
    isReactServer?: boolean;
    treeshake?: boolean;
    optimize?: boolean;
    splitChunks?: boolean;
    mockRuntime?: boolean;
    minify?: boolean;
  } = {}
) {
  return serializeOptimizeAsync(fs, { treeshake: true, ...options });
}

export async function serializeOptimizeAsync(
  fs: Record<string, string>,
  options: {
    isReactServer?: boolean;
    treeshake?: boolean;
    optimize?: boolean;
    splitChunks?: boolean;
    minify?: boolean;
    dev?: boolean;
    mockRuntime?: boolean;
  } = {}
) {
  return await serializeToWithGraph(
    {
      fs,
      options: {
        platform: 'web',
        dev: false,
        output: 'static',
        treeshake: false,
        optimize: true,
        splitChunks: true,
        minify: false,
        inlineRequires: true,
        ...options,
      },
      preModulesFs: options.mockRuntime
        ? {
            'mock-runtime': `{ /* "runtime" */ }`,
          }
        : undefined,
    },
    [treeShakeSerializer, reconcileTransformSerializerPlugin]
  );
}

export function expectImports(graph, name: string) {
  if (!graph.dependencies.has(name)) throw new Error(`Module not found: ${name}`);
  return expect([...graph.dependencies.get(name).dependencies.values()]);
}

export function createJSVirtualModule(path: string, code: string): Module<MixedOutput> {
  return {
    path,
    output: [
      {
        type: 'js/script/virtual',
        data: {
          code,
          // @ts-ignore: Metro types are incomplete
          lineCount: countLines(code),
          // @ts-ignore: Metro types are incomplete
          map: [],
        },
      },
    ],
    dependencies: new Map(),
    inverseDependencies: new CountingSet(),
    getSource: () => Buffer.from(code),
  };
}
