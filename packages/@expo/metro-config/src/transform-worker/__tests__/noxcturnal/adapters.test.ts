import * as babel from '@babel/core';
import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  defineNativePipeline,
  NativeTransformError,
  TransformSyntaxError,
  transform as transformWithNoxcturnal,
} from 'noxcturnal';
import type { PreflightPlan, PreflightTransforms } from 'noxcturnal';

import { importExportLiveBindingsPlugin } from '../../../transform-plugins/importExportLiveBindings';
import {
  createNoxcturnalSourceFacts,
  isPathInsideRoot,
  transformFileFullyWithNoxcturnal,
  transformFileFullyWithNoxcturnalSync,
  transformNodeModuleWithNoxcturnal,
  transformNodeModuleWithNoxcturnalSync,
} from '../../noxcturnal/noxcturnal-transformer';

function options(overrides: Partial<JsTransformOptions> = {}): JsTransformOptions {
  return {
    dev: false,
    experimentalImportSupport: true,
    hot: false,
    inlineRequires: false,
    minify: false,
    platform: 'ios',
    type: 'module',
    unstable_transformProfile: 'hermes-stable',
    customTransformOptions: { engine: 'hermes' },
    ...overrides,
  } as JsTransformOptions;
}

function fullConfig() {
  return {
    allowOptionalDependencies: false,
    asyncRequireModulePath: 'metro-runtime',
    globalPrefix: '',
    unstable_compactOutput: false,
  };
}

const filename = '/app/node_modules/example/index.js';
const workspaceFilename = '/app/packages/expo/build/value.js';
function canonicalModuleBody(code: string, unwrapMetroFactory = false): string {
  const file = babel.parseSync(code, { sourceType: 'script' });
  if (!file) throw new Error('Failed to parse transformed module');
  if (unwrapMetroFactory) {
    const statement = file.program.body[0];
    if (
      !babel.types.isExpressionStatement(statement) ||
      !babel.types.isCallExpression(statement.expression) ||
      !babel.types.isFunctionExpression(statement.expression.arguments[0])
    ) {
      throw new Error('Expected a Metro module factory');
    }
    const factoryBody = statement.expression.arguments[0].body;
    file.program.body = factoryBody.body;
    file.program.directives = factoryBody.directives;
    babel.traverse(file, {
      CallExpression(path) {
        if (
          babel.types.isIdentifier(path.node.callee) &&
          /REQUIRE$/.test(path.node.callee.name) &&
          babel.types.isStringLiteral(path.node.arguments[1])
        ) {
          path.replaceWith(
            babel.types.callExpression(babel.types.identifier('require'), [
              babel.types.cloneNode(path.node.arguments[1]),
            ])
          );
        }
      },
    });
  }
  babel.traverse(file, {
    StringLiteral(path) {
      path.node.extra = undefined;
    },
    VariableDeclaration(path) {
      // Block-scoping is owned by a different native phase. Normalize it here so
      // this comparison isolates only the import/export plugin's syntax.
      path.node.kind = 'var';
    },
  });
  return (
    babel.transformFromAstSync(file, undefined, {
      ast: false,
      babelrc: false,
      comments: false,
      compact: true,
      configFile: false,
    })?.code ?? ''
  );
}

const loadedBabelPresetExpo = require(
  path.join(__dirname, '../../../../../../babel-preset-expo/src')
);
const babelPresetExpo = loadedBabelPresetExpo.default ?? loadedBabelPresetExpo;
const requireFromBabelPresetExpo = createRequire(
  path.join(__dirname, '../../../../../../babel-preset-expo/package.json')
);
const requireFromMetroConfig = createRequire(path.join(__dirname, '../../../../package.json'));

function transformWithBabelPlugin(
  source: string,
  plugin: string,
  options?: Record<string, unknown>
): string {
  return transformWithBabelPlugins(source, [[plugin, options]]);
}

function transformWithBabelPlugins(
  source: string,
  plugins: readonly [string, Record<string, unknown> | undefined][],
  filename = '/app/node_modules/example/lowering.js'
): string {
  const result = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    compact: false,
    comments: false,
    plugins: plugins.map(([plugin, options]) => {
      let loadedPlugin: any;
      try {
        loadedPlugin = requireFromBabelPresetExpo(plugin);
      } catch {
        loadedPlugin = requireFromMetroConfig(plugin);
      }
      return [loadedPlugin.default ?? loadedPlugin, options];
    }),
  });
  if (!result?.code) throw new Error('Babel plugins produced no output');
  return result.code;
}

function transformWithNativeToggle(source: string, transforms: PreflightTransforms): string {
  const result = transformWithNoxcturnal(
    source,
    '/app/node_modules/example/lowering.js',
    defineNativePipeline({
      phases: [
        {
          name: 'lowering',
          native: {
            transforms,
            helpers: {
              mode: 'runtime',
              moduleName: '@babel/runtime',
              version: '7.29.2',
            },
          },
        },
      ],
    })
  );
  if (result.status !== 'complete') throw new Error(result.reason);
  return result.code;
}

function transformWithNativePlan(source: string, filename: string, plan: PreflightPlan): string {
  const result = transformWithNoxcturnal(
    source,
    filename,
    defineNativePipeline({
      phases: [{ name: 'language', native: plan }],
    }),
    {
      parser: filename.endsWith('.tsx') ? 'tsx' : 'jsx',
    }
  );
  if (result.status !== 'complete') throw new Error(result.reason);
  return result.code;
}

function transformWithBabelPreset(
  source: string,
  candidate: string,
  dev = false,
  server = false
): babel.BabelFileResult {
  const result = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    compact: false,
    comments: false,
    presets: [
      [
        babelPresetExpo,
        {
          unstable_transformProfile: 'hermes-stable',
          enableBabelRuntime: '7.29.2',
        },
      ],
    ],
    caller: {
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: dev,
      isServer: server,
      supportsStaticESM: true,
      babelRuntimeVersion: '7.29.2',
    } as babel.TransformCaller,
  });
  if (!result?.code || !result.map) throw new Error('Babel preset produced no output');
  return result;
}

function transformWithNonHermesBabelPreset(
  source: string,
  candidate: string
): babel.BabelFileResult {
  const result = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    compact: false,
    comments: false,
    presets: [
      [
        babelPresetExpo,
        {
          enableBabelRuntime: false,
          reanimated: false,
          expoUi: false,
          decorators: false,
        },
      ],
    ],
    caller: {
      name: 'metro',
      engine: undefined,
      platform: 'ios',
      isDev: false,
      isNodeModule: true,
      supportsStaticESM: true,
    } as babel.TransformCaller,
  });
  if (!result?.code || !result.map) throw new Error('Babel preset produced no output');
  return result;
}

function transformWithReactCompilerPreset(
  source: string,
  candidate: string
): babel.BabelFileResult {
  const result = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    presets: [[babelPresetExpo, { reanimated: false }]],
    caller: {
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: true,
      isNodeModule: false,
      supportsReactCompiler: true,
      supportsStaticESM: true,
    } as babel.TransformCaller,
  });
  if (!result?.code || !result.map) throw new Error('Compiler preset produced no output');
  return result;
}

function generatedPositionOf(
  code: string,
  needle: string,
  last = false
): { line: number; column: number } {
  const offset = last ? code.lastIndexOf(needle) : code.indexOf(needle);
  if (offset < 0) throw new Error(`Missing generated marker: ${needle}`);
  const prefix = code.slice(0, offset);
  const lines = prefix.split('\n');
  return { line: lines.length, column: lines.at(-1)!.length };
}

function generatedPositionsOf(code: string, needle: string): { line: number; column: number }[] {
  const positions: { line: number; column: number }[] = [];
  for (
    let offset = code.indexOf(needle);
    offset !== -1;
    offset = code.indexOf(needle, offset + 1)
  ) {
    const lines = code.slice(0, offset).split('\n');
    positions.push({ line: lines.length, column: lines.at(-1)!.length });
  }
  if (positions.length === 0) throw new Error(`Missing generated marker: ${needle}`);
  return positions.reverse();
}

function staticModuleSpecifiers(code: string): string[] {
  return [...code.matchAll(/\b(?:from\s*|import\s*|require\s*\(\s*)["']([^"']+)["']/g)].map(
    (match) => match[1]!
  );
}

void [
  babel,
  originalPositionFor,
  TraceMap,
  createRequire,
  path,
  defineNativePipeline,
  NativeTransformError,
  TransformSyntaxError,
  transformWithNoxcturnal,
  importExportLiveBindingsPlugin,
  createNoxcturnalSourceFacts,
  isPathInsideRoot,
  transformFileFullyWithNoxcturnal,
  transformFileFullyWithNoxcturnalSync,
  transformNodeModuleWithNoxcturnal,
  transformNodeModuleWithNoxcturnalSync,
  options,
  fullConfig,
  filename,
  workspaceFilename,
  canonicalModuleBody,
  transformWithBabelPlugin,
  transformWithBabelPlugins,
  transformWithNativeToggle,
  transformWithNativePlan,
  transformWithBabelPreset,
  transformWithNonHermesBabelPreset,
  transformWithReactCompilerPreset,
  generatedPositionOf,
  generatedPositionsOf,
  staticModuleSpecifiers,
];

it('does not bypass typed child contracts through NativeNodePath', () => {
  const fs = jest.requireActual<typeof import('node:fs')>('node:fs');
  const transformerRoot = path.join(__dirname, '../../noxcturnal');
  const transformerSource = [
    path.join(transformerRoot, 'noxcturnal-transformer.ts'),
    ...fs
      .readdirSync(path.join(transformerRoot, 'plugins'))
      .map((filename) => path.join(transformerRoot, 'plugins', filename)),
  ]
    .map((filename) => fs.readFileSync(filename, 'utf8'))
    .join('\n');
  expect(transformerSource).not.toContain('as unknown as NativeNodePath');
  expect(transformerSource).not.toMatch(/route:\s*'\*'\s*,\s*children:/);
  expect(transformerSource).not.toMatch(/children:\s*\{\s*'\*'/);
  expect(transformerSource).not.toMatch(/params:\s*\{\s*route:\s*'FormalParameters'/);
});

it.each([
  new TransformSyntaxError('syntax failure', '/app/file.js', { line: 1, column: 0 }, ''),
  new NativeTransformError('native failure', []),
  new Error('unknown transform failure'),
  'non-error thrown value',
])(
  'propagates %s unchanged through full-Metro and node-module sync and async adapters',
  async (thrown) => {
    const nox = require('noxcturnal') as typeof import('noxcturnal');
    const transform = jest.spyOn(nox, 'transform').mockImplementation(() => {
      throw thrown;
    });
    const base = {
      projectRoot: '/app',
      source: 'const value = 1;',
      options: options(),
      isDefaultExpoTransformer: true,
    } as const;
    const nodeInput = { ...base, filename: '/app/node_modules/pkg/index.js' };
    const fullInput = {
      ...base,
      filename: '/app/Component.js',
      config: fullConfig(),
    };

    try {
      let nodeThrown: unknown;
      try {
        transformNodeModuleWithNoxcturnalSync(nodeInput);
      } catch (error) {
        nodeThrown = error;
      }
      expect(nodeThrown).toBe(thrown);
      await expect(transformNodeModuleWithNoxcturnal(nodeInput)).rejects.toBe(thrown);
      let fullThrown: unknown;
      try {
        transformFileFullyWithNoxcturnalSync(fullInput);
      } catch (error) {
        fullThrown = error;
      }
      expect(fullThrown).toBe(thrown);
      await expect(transformFileFullyWithNoxcturnal(fullInput)).rejects.toBe(thrown);
    } finally {
      transform.mockRestore();
    }
  }
);

it('converts only an explicit Noxcturnal bailout to fallback in sync and async adapters', async () => {
  const nox = require('noxcturnal') as typeof import('noxcturnal');
  const transform = jest.spyOn(nox, 'transform').mockReturnValue({
    status: 'bailout',
    reason: 'expo-language:parse-error',
    source: 'const original = 1;',
    diagnostics: [],
  });
  const base = {
    projectRoot: '/app',
    source: 'const original = 1;',
    options: options(),
    isDefaultExpoTransformer: true,
  } as const;
  const nodeInput = { ...base, filename: '/app/node_modules/pkg/index.js' };
  const fullInput = {
    ...base,
    filename: '/app/Component.js',
    config: fullConfig(),
  };

  try {
    expect(transformNodeModuleWithNoxcturnalSync(nodeInput)).toEqual({
      status: 'fallback',
      reason: 'expo-language:parse-error',
    });
    await expect(transformNodeModuleWithNoxcturnal(nodeInput)).resolves.toEqual({
      status: 'fallback',
      reason: 'expo-language:parse-error',
    });
    expect(transformFileFullyWithNoxcturnalSync(fullInput)).toEqual({
      status: 'fallback',
      reason: 'expo-language:parse-error',
    });
    await expect(transformFileFullyWithNoxcturnal(fullInput)).resolves.toEqual({
      status: 'fallback',
      reason: 'expo-language:parse-error',
    });
  } finally {
    transform.mockRestore();
  }
});

it('throws stable fatal error for invalid full-Metro metadata', () => {
  const nox = require('noxcturnal') as typeof import('noxcturnal');
  const transform = jest.spyOn(nox, 'transform').mockReturnValue({
    status: 'complete',
    code: '',
    map: { mappings: '', names: [] },
    functionMap: null,
    metadata: {},
    diagnostics: [],
  });

  try {
    expect(() =>
      transformFileFullyWithNoxcturnalSync({
        projectRoot: '/app',
        filename: '/app/Component.js',
        source: 'const value = 1;',
        options: options(),
        isDefaultExpoTransformer: true,
        config: fullConfig(),
      })
    ).toThrow(
      expect.objectContaining({
        code: 'NOXCTURNAL_TRANSFORM_ERROR',
        reason: 'invalid-metro-metadata',
      })
    );
  } finally {
    transform.mockRestore();
  }
});

it('preserves fatal error identity through every Noxcturnal adapter entry point', async () => {
  const fatal = Object.assign(new SyntaxError('fatal'), {
    code: 'TRANSFORM_SYNTAX_ERROR',
  });
  const nox = require('noxcturnal') as typeof import('noxcturnal');
  const transform = jest.spyOn(nox, 'transform').mockImplementation(() => {
    throw fatal;
  });
  const base = {
    projectRoot: '/app',
    source: 'const value = 1;',
    options: options({
      customTransformOptions: { engine: 'hermes', reactCompiler: 'true' },
    }),
    isDefaultExpoTransformer: true,
  } as const;

  try {
    await expect(
      transformNodeModuleWithNoxcturnal({
        ...base,
        filename: '/app/node_modules/pkg/index.js',
      })
    ).rejects.toBe(fatal);
    await expect(
      transformFileFullyWithNoxcturnal({
        ...base,
        filename: '/app/Component.js',
        config: fullConfig(),
      })
    ).rejects.toBe(fatal);
  } finally {
    transform.mockRestore();
  }
});
