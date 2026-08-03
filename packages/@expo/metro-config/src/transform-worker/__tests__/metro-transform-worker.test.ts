/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with additional transforms moved to `babel-preset-expo` and modifications made for web support.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/index.js#L1
 */

import { fromRawMappings } from '@expo/metro/metro-source-map';
import type {
  JsTransformerConfig,
  JsTransformOptions,
  MinifierOptions,
} from '@expo/metro/metro-transform-worker';
import { TraceMap, originalPositionFor, generatedPositionFor } from '@jridgewell/trace-mapping';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import type { ExpoJsOutput } from '../../serializer/jsOutput';
import { materializeMap } from '../../serializer/packedMap';

/** Converts source mappings from Metro to a “TraceMap”, which is similar to source-map’s SourceMapConsumer */
const toTraceMap = (output: ExpoJsOutput, contents: string) => {
  // `fromRawMappings` needs plain tuples; the worker emits the packed
  // wire shape, so materialize at the boundary.
  const map = fromRawMappings([
    {
      ...output.data,
      map: materializeMap(output.data.map),
      path: '',
      source: contents,
      isIgnored: false,
    },
  ]).toMap();
  return new TraceMap({
    ...map,
    file: output.data.code,
    sources: [null],
    sourcesContent: [contents || null],
  } as ConstructorParameters<typeof TraceMap>[0]);
};

const originalWarn = console.warn;

beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

jest
  .mock(
    '@expo/metro/metro-transform-worker/utils/getMinifier',
    () =>
      () =>
      ({ code, map, config }: MinifierOptions) => {
        const output = config.output as { comments?: boolean };
        const trimmed = output.comments ? code : code.replace('/*#__PURE__*/', '');
        return {
          code: trimmed.replace('arbitrary(code)', 'minified(code)'),
          map,
        };
      }
  )
  .mock('@expo/metro/metro-transform-plugins', () => ({
    ...jest.requireActual('@expo/metro/metro-transform-plugins'),
    inlinePlugin: () => ({}),
    constantFoldingPlugin: () => ({}),
  }))
  .mock('metro-minify-terser');

const babelTransformerPath = require.resolve('@expo/metro-config/babel-transformer');

const transformerContents = jest.requireActual('fs').readFileSync(babelTransformerPath);

const HEADER_DEV =
  '__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {';
const HEADER_PROD = '__d(function (g, r, i, a, m, e, d) {';

// let fs: typeof import('fs');
let Transformer: typeof import('../metro-transform-worker');

const baseConfig = {
  allowOptionalDependencies: false,
  assetPlugins: [],
  assetRegistryPath: '',
  asyncRequireModulePath: 'asyncRequire',
  babelTransformerPath,
  dynamicDepsInPackages: 'reject',
  enableBabelRCLookup: false,
  enableBabelRuntime: true,
  globalPrefix: '',
  hermesParser: false,
  minifierConfig: { output: { comments: false } },
  minifierPath: 'minifyModulePath',
  optimizationSizeLimit: 100000,
  publicPath: '/assets',
  unstable_dependencyMapReservedName: null,
  unstable_compactOutput: false,
  unstable_disableModuleWrapping: false,
  unstable_disableNormalizePseudoGlobals: false,
  unstable_allowRequireContext: false,
  unstable_noxcturnalTransformWorker: true,
} as JsTransformerConfig & { unstable_noxcturnalTransformWorker: boolean };

const baseTransformOptions: JsTransformOptions = {
  dev: true,
  inlinePlatform: false,
  inlineRequires: false,
  minify: false,
  platform: 'ios',
  type: 'module',
  unstable_transformProfile: 'default',
  customTransformOptions: {
    __proto__: null,
  },
};

jest.mock('fs');

beforeEach(() => {
  jest.resetModules();

  //   jest.mock('fs', () => new (require('metro-memory-fs'))());

  //   fs = require('fs');
  Transformer = require('../metro-transform-worker');

  vol.reset();

  fs.mkdirSync('/root/local', { recursive: true });
  fs.mkdirSync(path.dirname(babelTransformerPath), { recursive: true });
  fs.writeFileSync(babelTransformerPath, transformerContents);
});

it('keeps the Noxcturnal transform worker disabled by default', async () => {
  const noxcturnal = require('noxcturnal') as typeof import('noxcturnal');
  const transform = jest.spyOn(noxcturnal, 'transform');
  const config = { ...baseConfig, unstable_noxcturnalTransformWorker: undefined };

  try {
    await Transformer.transform(
      config,
      '/root',
      'local/file.js',
      Buffer.from('module.exports = 1;', 'utf8'),
      baseTransformOptions
    );
    expect(transform).not.toHaveBeenCalled();
  } finally {
    transform.mockRestore();
  }
});

it('runs native React Compiler and Refresh through the full Metro path', async () => {
  const contents = `type Props = { value: number };
export function Component(props: Props) {
  return <View>{props.value}</View>;
}`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/Component.tsx',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      experimentalImportSupport: false,
      customTransformOptions: {
        __proto__: null,
        engine: 'hermes',
        reactCompiler: 'true',
      },
    }
  );
  const output = result.output[0]!;

  expect(output.data.code).toContain('react/compiler-runtime');
  expect(output.data.code).toMatch(/reactcompilerruntime\.c\)\(2\)/i);
  expect(output.data.code).toContain('$RefreshReg$');
  expect(output.data.code).not.toContain('type Props');
  expect(output.data.code).not.toContain('<View>');

  const generatedOffset = output.data.code.indexOf('function Component');
  const generatedPrefix = output.data.code.slice(0, generatedOffset);
  const generatedLines = generatedPrefix.split('\n');
  const original = originalPositionFor(toTraceMap(output, contents), {
    line: generatedLines.length,
    column: generatedLines.at(-1)!.length,
  });
  expect(original.line).toBe(2);
});

it('transforms a simple script', async () => {
  const contents = 'someReallyArbitrary(code)';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, type: 'script' }
  );

  expect(result.output[0]!.type).toBe('js/script');
  expect(result.output[0]!.data.code).toBe(
    [
      '(function (global) {',
      'someReallyArbitrary(code);',
      "})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);",
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0]!, contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 0 })).toMatchObject({
    line: 2,
    column: 0,
  });

  expect(originalPositionFor(trace, { line: 2, column: 2 })).toMatchObject({
    line: 1,
    column: 0,
    name: null,
  });

  // The generated polyfill wrapper is deliberately sourceless.
  expect(originalPositionFor(trace, { line: 3, column: 10 }).line).toBeNull();
  expect(originalPositionFor(trace, { line: 3, column: 59 }).line).toBeNull();
  expect(originalPositionFor(trace, { line: 3, column: 100 }).line).toBeNull();

  expect(result.output[0]!.data.functionMap).toMatchSnapshot();
  expect(result.dependencies).toEqual([]);
});

it('transforms a simple module', async () => {
  const contents = 'arbitrary(code)';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  const trace = toTraceMap(result.output[0]!, contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 0 })).toMatchObject({
    line: 2,
    column: 0,
  });
  expect(originalPositionFor(trace, { line: 2, column: 0 })).toMatchObject({
    line: 1,
    column: 0,
    name: null,
  });
  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toBe([HEADER_DEV, 'arbitrary(code);', '', '});'].join('\n'));
  expect(result.output[0]!.data.functionMap).toMatchSnapshot();
  expect(result.dependencies).toEqual([]);
});

it('uses Noxcturnal instead of the Babel preset for eligible node_modules', async () => {
  const contents = `module.exports = [process.env.EXPO_OS, process.env.NODE_ENV, __DEV__, require('dep')];`;

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).toMatch(
    /module\.exports = \[\s*"ios",\s*"production",\s*false,\s*_\$\$_REQUIRE\(_dependencyMap\[0\]\)\s*\]/
  );
  expect(result.output[0]!.data.hasCjsExports).toBe(true);
  expect(result.output[0]!.data.functionMap).toEqual({
    mappings: 'AAA,IC;CDQ',
    names: ['<global>', '__d$argument_0'],
  });
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(['dep']);

  const trace = toTraceMap(result.output[0]!, contents);
  expect(originalPositionFor(trace, { line: 6, column: 2 })).toMatchObject({
    line: 1,
    column: 70,
  });
});

it.each([
  '\0polyfill:environment-variables',
  '/root/router-e2e?ctx=1122149ada429c11a789cd9dfdcaefb64b6dd8f5',
])('uses the full native path for extensionless virtual module %s', async (filename) => {
  const contents = `module.exports= require('dep');`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      experimentalImportSupport: true,
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).toMatch(
    /module\.exports\s*=\s*_\$\$_REQUIRE\(_dependencyMap\[0\], "dep"\);/
  );
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(['dep']);
});

it.each(['/repo/packages/expo/virtual/streams.js', '\0polyfill:environment-variables'])(
  'uses the full native path to wrap script polyfill %s',
  async (filename) => {
    const contents = `globalThis.ReadableStream ||= require('stream/web').ReadableStream;`;
    const result = await Transformer.transform(
      baseConfig,
      '/root',
      filename,
      Buffer.from(contents, 'utf8'),
      {
        ...baseTransformOptions,
        type: 'script',
        experimentalImportSupport: true,
        customTransformOptions: { engine: 'hermes' },
      }
    );

    expect(result.output[0]!.type).toBe('js/script');
    expect(result.output[0]!.data.code).toMatch(/^\(function \(global\) \{/);
    expect(result.output[0]!.data.code).toContain('globalThis.ReadableStream');
    expect(result.output[0]!.data.code).not.toContain('__d(function');
    expect(result.dependencies).toEqual([]);
  }
);

it('uses the full native path and configured minifier for production application TSX', async () => {
  const contents = `type Props = { code: unknown };
export function App({ code }: Props) {
  return <View testID="value">{arbitrary(code)}</View>;
}`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/local/App.tsx',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).not.toMatch(/\btype Props\b|<View/);
  expect(result.output[0]!.data.code).toContain('minified(code)');
  expect(result.dependencies.map((dependency) => dependency.name)).toContain('react/jsx-runtime');
  const trace = toTraceMap(result.output[0]!, contents);
  const marker = result.output[0]!.data.code.indexOf('function App');
  const prefix = result.output[0]!.data.code.slice(0, marker).split('\n');
  expect(
    originalPositionFor(trace, {
      line: prefix.length,
      column: prefix.at(-1)!.length,
    }).line
  ).toBe(2);
});

it('uses the full native path for plain production application JavaScript', async () => {
  const contents = `export { value } from './value';`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/src/config.js',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).toContain('__d(function');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(['./value']);
});

it('uses the full native path for production Node application TSX', async () => {
  const contents = `import value from './value';
export default function Route(): JSX.Element {
  return <main>{typeof window}:{value}</main>;
}`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/routes/render.tsx',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes', environment: 'node' },
    }
  );

  expect(result.output[0]!.data.code).not.toMatch(/JSX\.Element|<main>|typeof window/);
  expect(result.output[0]!.data.code).toContain('"undefined"');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(
    expect.arrayContaining(['./value', 'react/jsx-runtime'])
  );
});

it('uses the full native path for ordinary production web TSX', async () => {
  const contents = `import value from './value';
export default function Route(): JSX.Element {
  return <main>{value}</main>;
}`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/web/route.tsx',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      platform: 'web',
      experimentalImportSupport: true,
      unstable_transformProfile: 'default',
      customTransformOptions: {},
    }
  );

  expect(result.output[0]!.data.code).not.toMatch(/JSX\.Element|<main>/);
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(
    expect.arrayContaining(['./value', 'react/jsx-runtime'])
  );
});

it('rewrites React Native imports through the complete native web path', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/web/route.tsx',
    Buffer.from(
      `import { View, Text as Label } from 'react-native';
export default function Route() {
  return <View><Label>native web</Label></View>;
}`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      platform: 'web',
      experimentalImportSupport: true,
      unstable_transformProfile: 'default',
      customTransformOptions: {},
    }
  );

  expect(result.output[0]!.data.code).not.toMatch(/<View>|from ['"]react-native['"]/);
  expect(result.dependencies.map(({ name }) => name)).toEqual(
    expect.arrayContaining([
      'react-native-web/dist/exports/View',
      'react-native-web/dist/exports/Text',
      'react/jsx-runtime',
    ])
  );
});

it('inlines APP_MANIFEST through the complete native web path', async () => {
  const previousManifest = process.env.APP_MANIFEST;
  process.env.APP_MANIFEST = '{"name":"worker-native"}';
  try {
    const result = await Transformer.transform(
      baseConfig,
      '/root',
      '/root/web/constants.js',
      Buffer.from('const manifest = process.env.APP_MANIFEST; module.exports = manifest;', 'utf8'),
      {
        ...baseTransformOptions,
        dev: false,
        platform: 'web',
        experimentalImportSupport: true,
        unstable_transformProfile: 'default',
        customTransformOptions: {},
      }
    );

    expect(result.output[0]!.data.code).toContain(String.raw`{\"name\":\"worker-native\"}`);
    expect(result.output[0]!.data.code).not.toContain('process.env.APP_MANIFEST');
  } finally {
    if (previousManifest === undefined) delete process.env.APP_MANIFEST;
    else process.env.APP_MANIFEST = previousManifest;
  }
});

it('tree-shakes @expo/ui Icon.select through the complete native path', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/app/icon.js',
    Buffer.from(
      `import { Icon } from '@expo/ui';
export const icon = Icon.select({ ios: 'heart.fill', android: import('./heart.xml') });`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      platform: 'ios',
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).toContain('heart.fill');
  expect(result.output[0]!.data.code).not.toMatch(/Icon\.select|heart\.xml/);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['@expo/ui']);
});

it('serializes widget functions through the complete native path', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/app/widget.tsx',
    Buffer.from(
      `export function Greeting({ name }: { name: string }) {
  'widget';
  return <Text>{name}</Text>;
}`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      platform: 'ios',
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).not.toContain("'widget'");
  expect(result.output[0]!.data.code).toContain('var Greeting = `function');
  expect(result.output[0]!.data.code).toContain('jsx');
});

it('preserves Babel diagnostics for precise restricted imports', async () => {
  await expect(
    Transformer.transform(
      baseConfig,
      '/root',
      '/root/app/client.js',
      Buffer.from(`import value from 'server-only';`, 'utf8'),
      {
        ...baseTransformOptions,
        dev: false,
        platform: 'ios',
        experimentalImportSupport: true,
        unstable_transformProfile: 'hermes-stable',
        customTransformOptions: { engine: 'hermes' },
      }
    )
  ).rejects.toThrow("Importing 'server-only' module is not allowed in a client component.");
});

it('creates and propagates native React Server client references', async () => {
  const filename = '/root/app/client.tsx';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from(
      `"use client";
export const value: number = 1;
export default function Component() { return <View />; }`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: false,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        engine: 'hermes',
        environment: 'react-server',
      },
    }
  );
  const output = result.output[0]!;

  expect(output.data.code).toContain('createClientModuleProxy');
  expect(output.data.code).toContain('registerClientReference');
  expect(output.data.code).not.toContain('<View');
  expect(output.data.reactClientReference).toBe('file:///root/app/client.tsx');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual([
    'react-server-dom-webpack/server',
  ]);
});

it('creates and propagates native DOM component references', async () => {
  const filename = '/root/app/Card.tsx';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from(
      `"use dom";
export default function Card({ title }: { title: string }) {
  return <main>{title}</main>;
}`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: true,
      experimentalImportSupport: false,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );
  const output = result.output[0]!;

  expect(output.data.code).toContain('expo/dom/internal');
  expect(output.data.code).toContain('DOM(Card)');
  expect(output.data.code).not.toContain('<main');
  expect(output.data.expoDomComponentReference).toBe('file:///root/app/Card.tsx');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual([
    'react',
    'expo/dom/internal',
  ]);
});

it('creates and propagates native client-side server references', async () => {
  const filename = '/root/app/actions.ts';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from(
      `"use server";
export async function save() { return 1; }
export default async function reset() { return 2; }`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: false,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );
  const output = result.output[0]!;

  expect(output.data.code).toContain('createServerReference');
  expect(output.data.code).toContain('./app/actions.ts#save');
  expect(output.data.code).not.toContain('return 1');
  expect(output.data.reactServerReference).toBe('file:///root/app/actions.ts');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual([
    'react-server-dom-webpack/client',
    'expo-router/rsc/internal',
  ]);
});

it('registers and propagates native module-level React Server actions', async () => {
  const filename = '/root/app/server-actions.ts';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from(
      `"use server";
export async function save() { return 1; }
export const remove = async () => 2;`,
      'utf8'
    ),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: false,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: {
        engine: 'hermes',
        environment: 'react-server',
      },
    }
  );
  const output = result.output[0]!;

  expect(output.data.code).toContain('registerServerReference');
  expect(output.data.code).toContain('./app/server-actions.ts');
  expect(output.data.code).not.toContain('"use server"');
  expect(output.data.reactServerReference).toBe('file:///root/app/server-actions.ts');
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual([
    'react-server-dom-webpack/server',
  ]);
});

it('uses native source transforms and preserves graph-optimization reconciliation metadata', async () => {
  const contents = `import primary, { alpha } from 'pkg';
export { beta } from 'reexport';
export const output = [primary, alpha];`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes', optimize: true },
    }
  );

  expect(result.output[0]!.data.code).not.toContain('__d(function');
  expect(result.output[0]!.data.code).toMatch(/from ["']pkg["']/);
  expect(result.output[0]!.data.ast).toBeDefined();
  expect(result.output[0]!.data.reconcile).toBeDefined();
  expect(() => JSON.stringify(result.output[0]!.data.ast)).not.toThrow();
  expect(
    result.dependencies.map((dependency) => [dependency.name, dependency.data.exportNames])
  ).toEqual([
    ['pkg', ['default', 'alpha']],
    ['reexport', ['beta']],
  ]);
});

it('finalizes native dependency export metadata without exposing its mutable sets', async () => {
  const contents = `import 'side-effect';
import primary from 'default-import';
import * as namespace from 'namespace-import';
import { alpha as a, duplicate as d1 } from 'pkg';
import { beta as b, duplicate as d2 } from 'pkg';
import { gamma as g, alpha as a2 } from 'pkg';
export { first as publicFirst } from 'reexports';
export { second as publicSecond, first as alternateFirst } from 'reexports';
const commonOne = require('commonjs');
const commonTwo = require('commonjs');
export default [primary, namespace, a, d1, b, d2, g, a2, commonOne, commonTwo];`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes', optimize: true },
    }
  );

  const dependencies = new Map(
    result.dependencies.map((dependency) => [dependency.name, dependency] as const)
  );
  expect([...dependencies.keys()]).toEqual([
    'side-effect',
    'default-import',
    'namespace-import',
    'pkg',
    'reexports',
    'commonjs',
  ]);
  expect(dependencies.get('commonjs')).toMatchObject({
    data: { exportNames: ['*'], imports: 2, isESMImport: false },
  });
  expect(dependencies.get('side-effect')).toMatchObject({
    data: { exportNames: [], imports: 1, isESMImport: true },
  });
  expect(dependencies.get('default-import')).toMatchObject({
    data: { exportNames: ['default'], imports: 1, isESMImport: true },
  });
  expect(dependencies.get('namespace-import')).toMatchObject({
    data: { exportNames: ['*'], imports: 1, isESMImport: true },
  });
  expect(dependencies.get('pkg')).toMatchObject({
    data: {
      exportNames: ['alpha', 'duplicate', 'beta', 'gamma'],
      imports: 3,
      isESMImport: true,
    },
  });
  expect(dependencies.get('reexports')).toMatchObject({
    data: { exportNames: ['first', 'second'], imports: 2, isESMImport: true },
  });
  for (const dependency of result.dependencies) {
    expect(Object.keys(dependency)).not.toContain('exportNameSet');
  }
  expect(JSON.stringify(result.dependencies)).not.toContain('exportNameSet');
});

it('uses Noxcturnal for the complete Metro transform of eligible dependencies', async () => {
  const contents = `var oddly_spaced= require('dep');\nmodule.exports=oddly_spaced;`;
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from(contents, 'utf8'),
    {
      ...baseTransformOptions,
      experimentalImportSupport: true,
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).toBe(
    [
      HEADER_DEV,
      `var oddly_spaced= _$$_REQUIRE(_dependencyMap[0], "dep");`,
      'module.exports=oddly_spaced;',
      '});',
    ].join('\n')
  );
  expect(result.output[0]!.data.hasCjsExports).toBe(true);
  expect(result.dependencies).toEqual([
    {
      name: 'dep',
      data: expect.objectContaining({
        asyncType: null,
        imports: 1,
        isESMImport: false,
      }),
    },
  ]);

  const trace = toTraceMap(result.output[0]!, contents);
  expect(generatedPositionFor(trace, { source: '', line: 1, column: 0 })).toMatchObject({
    line: 2,
    column: 0,
  });
});

it('propagates native Expo Router loader metadata through the worker result', async () => {
  const filename = '/root/app/route.js';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from('export async function loader() { return null; } export const value = 1;', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes' },
    }
  );

  expect(result.output[0]!.data.code).not.toContain('loader');
  expect(result.output[0]!.data.code).toContain('value');
  expect(result.output[0]!.data.loaderReference).toBe(filename);
});

it('propagates native Expo Router loader metadata for optimized non-Hermes web bundles', async () => {
  const filename = '/root/routes/route.js';
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    filename,
    Buffer.from('export async function loader() { return null; } export const value = 1;', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      platform: 'web',
      experimentalImportSupport: true,
      customTransformOptions: { routerRoot: 'routes', optimize: true },
    }
  );

  expect(result.output[0]!.data.code).not.toContain('loader');
  expect(result.output[0]!.data.code).toContain('value');
  expect(result.output[0]!.data.loaderReference).toBe(filename);
});

it('runs the configured minifier after a complete native dependency transform', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from('module.exports = arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      experimentalImportSupport: true,
      customTransformOptions: { engine: 'hermes' },
    }
  );
  expect(result.output[0]!.data.code).toContain('minified(code)');
});

it('collects optional dependencies through the complete native path', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, allowOptionalDependencies: true },
    '/root',
    '/root/node_modules/example/index.js',
    Buffer.from(`try { module.exports = require('optional-package'); } catch {}`, 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      experimentalImportSupport: true,
      customTransformOptions: { engine: 'hermes' },
    }
  );
  expect(result.dependencies).toHaveLength(1);
  expect(result.dependencies[0]!.name).toBe('optional-package');
  expect(result.dependencies[0]!.data.isOptional).toBe(true);
  expect(result.output[0]!.data.code).toContain('"optional-package"');
});

it('transforms a module with dependencies', async () => {
  const contents = [
    '"use strict";',
    'require("./a");',
    'arbitrary(code);',
    'const b = require("b");',
    'import c from "./c";',
  ].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toBe(
    [
      HEADER_DEV,
      '"use strict";',
      '_$$_REQUIRE(_dependencyMap[2], "./c");',
      '_$$_REQUIRE(_dependencyMap[0], "./a");',
      'arbitrary(code);',
      'var b = _$$_REQUIRE(_dependencyMap[1], "b");',
      '',
      '',
      '});',
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0]!, contents);

  expect(
    generatedPositionFor(trace, { source: '', line: 2, column: 0 } /* require("./a") */)
  ).toMatchObject({ line: 4, column: 0 });

  expect(originalPositionFor(trace, { line: 5, column: 0 })).toMatchObject({
    line: 3,
    column: 0,
    name: null,
  });
  expect(originalPositionFor(trace, { line: 6, column: 4 })).toMatchObject({
    line: 4,
    column: 0,
    name: null,
  });

  expect(result.output[0]!.data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    { data: expect.objectContaining({ asyncType: null }), name: './a' },
    { data: expect.objectContaining({ asyncType: null }), name: 'b' },
    { data: expect.objectContaining({ asyncType: null }), name: './c' },
  ]);
});

it('transforms an es module with asyncToGenerator', async () => {
  const contents = 'export async function test() {}';

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toMatchSnapshot();

  const trace = toTraceMap(result.output[0]!, contents);

  expect(generatedPositionFor(trace, { source: '', line: 1, column: 12 })).toMatchObject({
    line: 10,
    column: 0,
  });

  expect(originalPositionFor(trace, { line: 10, column: 9 })).toMatchObject({
    line: 1,
    column: 7,
    name: null,
  });

  expect(result.output[0]!.data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/asyncToGenerator',
    },
  ]);
});

it('transforms async generators', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('export async function* test() { yield "ok"; }', 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0]!.data.code).toMatchSnapshot();
  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({ asyncType: null }),
      name: '@babel/runtime/helpers/wrapAsyncGenerator',
    },
  ]);
});

it('transforms import/export syntax when experimental flag is on', async () => {
  // NOTE(@kitten): We have to add a side-effect, or the import will be dropped
  const contents = ['import c from "./c"; test(c);'].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, experimentalImportSupport: true }
  );

  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toBe(
    [
      HEADER_DEV,
      'function _interopDefault(e) {',
      '  return e && e.__esModule ? e : { default: e };',
      '}',
      'var _c = _$$_REQUIRE(_dependencyMap[0], "./c");',
      'var c = _interopDefault(_c);',
      '',
      'test(c.default);',
      '',
      '});',
    ].join('\n')
  );

  const trace = toTraceMap(result.output[0]!, contents);

  expect(originalPositionFor(trace, { line: 8, column: 5 })).toMatchObject({
    line: 1,
    column: 21,
    name: null,
  });

  expect(result.output[0]!.data.functionMap).toMatchSnapshot();

  expect(result.dependencies).toEqual([
    {
      data: expect.objectContaining({
        asyncType: null,
      }),
      name: './c',
    },
  ]);
});

it('does not add "use strict" on non-modules', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'node_modules/local/file.js',
    Buffer.from('module.exports = {};', 'utf8'),
    { ...baseTransformOptions, experimentalImportSupport: true }
  );

  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toBe([HEADER_DEV, 'module.exports = {};', '});'].join('\n'));
});

it('preserves require() calls when module wrapping is disabled', async () => {
  const contents = ['require("./c");'].join('\n');

  const result = await Transformer.transform(
    {
      ...baseConfig,
      unstable_disableModuleWrapping: true,
    },
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    baseTransformOptions
  );

  expect(result.output[0]!.type).toBe('js/module');
  expect(result.output[0]!.data.code).toBe('require("./c");\n');
});

it('reports filename when encountering unsupported dynamic dependency', async () => {
  const contents = ['require("./a");', 'let a = arbitrary(code);', 'const b = require(a);'].join(
    '\n'
  );

  try {
    await Transformer.transform(
      baseConfig,
      '/root',
      'local/file.js',
      Buffer.from(contents, 'utf8'),
      baseTransformOptions
    );
    throw new Error('should not reach this');
  } catch (error) {
    expect((error as Error).message).toMatchSnapshot();
  }
});

it('supports dynamic dependencies from within `node_modules`', async () => {
  expect(
    (
      await Transformer.transform(
        {
          ...baseConfig,
          dynamicDepsInPackages: 'throwAtRuntime',
        },
        '/root',
        'node_modules/foo/bar.js',
        Buffer.from('require(foo.bar);', 'utf8'),
        baseTransformOptions
      )
    ).output[0]!.data.code
  ).toBe(
    [
      HEADER_DEV,
      '  (function (line) {',
      "    throw new Error('Dynamic require defined at line ' + line + '; not supported by Metro');",
      '  })(1);',
      '});',
    ].join('\n')
  );
});

it('minifies the code correctly', async () => {
  expect(
    (
      await Transformer.transform(
        baseConfig,
        '/root',
        'local/file.js',
        Buffer.from('arbitrary(code);', 'utf8'),
        { ...baseTransformOptions, minify: true }
      )
    ).output[0]!.data.code
  ).toBe([HEADER_PROD, 'minified(code);', '', '});'].join('\n'));
});

it('minifies a JSON file', async () => {
  expect(
    (
      await Transformer.transform(
        baseConfig,
        '/root',
        'local/file.json',
        Buffer.from('arbitrary(code);', 'utf8'),
        { ...baseTransformOptions, minify: true }
      )
    ).output[0]!.data.code
  ).toBe(
    [
      '__d(function(global, require, _importDefaultUnused, _importAllUnused, module, exports, _dependencyMapUnused) {',
      '  module.exports = minified(code);;',
      '});',
    ].join('\n')
  );
});

it('does not wrap a JSON file when disableModuleWrapping is enabled', async () => {
  expect(
    (
      await Transformer.transform(
        {
          ...baseConfig,
          unstable_disableModuleWrapping: true,
        },
        '/root',
        'local/file.json',
        Buffer.from('arbitrary(code);', 'utf8'),
        baseTransformOptions
      )
    ).output[0]!.data.code
  ).toBe('module.exports = arbitrary(code);;');
});

it('uses a reserved dependency map name and prevents it from being minified', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_dependencyMapReservedName: 'THE_DEP_MAP' },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, THE_DEP_MAP) {
    minified(code);

    });"
  `);
});

it('throws if the reserved dependency map name appears in the input', async () => {
  await expect(
    Transformer.transform(
      { ...baseConfig, unstable_dependencyMapReservedName: 'THE_DEP_MAP' },
      '/root',
      'local/file.js',
      Buffer.from(
        'arbitrary(code); /* the code is not allowed to mention THE_DEP_MAP, even in a comment */',
        'utf8'
      ),
      { ...baseTransformOptions, dev: false, minify: true }
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Source code contains the reserved string \`THE_DEP_MAP\` at character offset 55"`
  );
});

it('allows disabling the normalizePseudoGlobals pass when minifying', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_disableNormalizePseudoGlobals: true },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
    minified(code);

    });"
  `);
});

it('allows emitting compact code when not minifying', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, unstable_compactOutput: true },
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: false }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(
    `"__d(function(global,_$$_REQUIRE,_$$_IMPORT_DEFAULT,_$$_IMPORT_ALL,module,exports,_dependencyMap){arbitrary(code)});"`
  );
});

it('skips minification in Hermes stable transform profile', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
      customTransformOptions: { __proto__: null, bytecode: '1' },
    }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
    arbitrary(code);

    });"
  `);
});

it('skips minification in Hermes canary transform profile', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
      customTransformOptions: { __proto__: null, bytecode: '1' },
    }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
    arbitrary(code);

    });"
  `);
});

it('minifies with Hermes transform profile if bytecode is disabled', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('arbitrary(code);', 'utf8'),
    {
      ...baseTransformOptions,
      dev: false,
      minify: true,
      unstable_transformProfile: 'hermes-canary',
    }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
    minified(code);

    });"
  `);
});

it('counts all line endings correctly', async () => {
  const transformStr = (str: string) =>
    Transformer.transform(baseConfig, '/root', 'local/file.js', Buffer.from(str, 'utf8'), {
      ...baseTransformOptions,
      dev: false,
      minify: false,
    });

  const differentEndingsResult = await transformStr('one\rtwo\r\nthree\nfour\u2028five\u2029six');

  const standardEndingsResult = await transformStr('one\ntwo\nthree\nfour\nfive\nsix');

  expect(differentEndingsResult.output[0]!.data.lineCount).toEqual(
    standardEndingsResult.output[0]!.data.lineCount
  );
});

it('outputs comments when `minify: false`', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: false }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
    /*#__PURE__*/arbitrary(code);
    });"
  `);
});

it('omits comments when `minify: true`', async () => {
  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
     minified(code);

    });"
  `);
});

it('allows outputting comments when `minify: true`', async () => {
  const result = await Transformer.transform(
    { ...baseConfig, minifierConfig: { output: { comments: true } } },
    '/root',
    'local/file.js',
    Buffer.from('/*#__PURE__*/arbitrary(code);', 'utf8'),
    { ...baseTransformOptions, dev: false, minify: true }
  );
  expect(result.output[0]!.data.code).toMatchInlineSnapshot(`
    "__d(function (g, r, i, a, m, e, d) {
    /*#__PURE__*/minified(code);
    });"
  `);
});

it('allows the constantFoldingPlugin to not remove used helpers when `dev: false`', async () => {
  // NOTE(kitten): The `constantFoldingPlugin` removes used, inlined Babel helpers, unless
  // the AST path has been re-crawled. If this regressed, check whether `programPath.scope.crawl()`
  // is called before this plugin is run.
  jest.mock('@expo/metro/metro-transform-plugins', () => ({
    ...jest.requireActual('@expo/metro/metro-transform-plugins'),
    inlinePlugin: () => ({}),
    constantFoldingPlugin: jest.requireActual<typeof import('@expo/metro/metro-transform-plugins')>(
      '@expo/metro/metro-transform-plugins'
    ).constantFoldingPlugin,
  }));

  const contents = ['import * as test from "test-module";', 'export { test };'].join('\n');

  const result = await Transformer.transform(
    baseConfig,
    '/root',
    'local/file.js',
    Buffer.from(contents, 'utf8'),
    { ...baseTransformOptions, dev: false }
  );
  expect(result.output[0]!.data.code).toMatchSnapshot();
});

describe('tree shaking AST cleaning', () => {
  it('strips non-serializable values from AST when optimize is enabled', async () => {
    // This test verifies that the transformer cleans the AST of non-serializable values
    // (like Symbols that React Compiler may add) before returning it for tree shaking.
    const contents = `
      export function Component({ controller, onSubmit }) {
        const usingProvider = !!controller;
        const files = usingProvider ? controller.files : [];
        const text = usingProvider ? controller.value : 'default';

        const handleSubmit = (event) => {
          event.preventDefault();
          Promise.all(files.map(async (item) => {
            if (item.url) {
              return { id: item.id, url: item.url };
            }
            return item;
          })).then((converted) => {
            const result = onSubmit({ text, files: converted }, event);
            if (result instanceof Promise) {
              result.then(() => {
                if (usingProvider) controller.clear();
              });
            }
          });
        };

        return handleSubmit;
      }
    `;

    const result = await Transformer.transform(
      {
        ...baseConfig,
        unstable_disableModuleWrapping: true,
      },
      '/root',
      'local/file.js',
      Buffer.from(contents, 'utf8'),
      {
        ...baseTransformOptions,
        dev: false,
        experimentalImportSupport: true,
        customTransformOptions: {
          __proto__: null,
          optimize: true,
          reactCompiler: 'true',
        },
      }
    );

    // Verify the AST is present (tree shaking stores it)
    const ast = result.output[0]!.data.ast;
    expect(ast).toBeDefined();

    // The key assertion: AST must be JSON-serializable (no Symbols, functions, etc.)
    expect(() => JSON.stringify(ast)).not.toThrow();

    // Verify the serialized AST can be parsed back
    const serialized = JSON.stringify(ast);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
