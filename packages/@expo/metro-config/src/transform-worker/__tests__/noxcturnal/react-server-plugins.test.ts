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

it.each([
  ['a comment', `// codegenNativeComponent("View")\nmodule.exports = "ordinary";`],
  ['a string', `module.exports = "codegenNativeCommands should not trigger Codegen";`],
  [
    'a shadowed call',
    `function codegenNativeComponent(value) { return value; }
module.exports = codegenNativeComponent("ordinary");`,
  ],
])('does not classify Codegen-like text in %s as React Native Codegen', async (_name, source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
});

it.each([
  [
    'Flow TurboModule',
    `// @flow
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";
export interface Spec extends TurboModule { getValue(): string; }`,
  ],
  [
    'TypeScript Native Component',
    `import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
export default codegenNativeComponent<{ value: string }>("NativeValue");`,
  ],
  [
    'TypeScript Native Commands',
    `import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
interface NativeCommands { focus(viewRef: unknown): void; }
export default codegenNativeCommands<NativeCommands>({ supportedCommands: ["focus"] });`,
  ],
  [
    'React Native named-export Native Component',
    `import { codegenNativeComponent } from "react-native";
export default codegenNativeComponent<{ value: string }>("NativeValue");`,
  ],
  [
    'React Native named-export Native Commands',
    `import { codegenNativeCommands } from "react-native";
interface NativeCommands { focus(viewRef: unknown): void; }
export default codegenNativeCommands<NativeCommands>({ supportedCommands: ["focus"] });`,
  ],
])('keeps a %s candidate on pristine Babel input', async (_name, source) => {
  await expect(
    transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source,
      options: options(),
      isDefaultExpoTransformer: true,
    })
  ).resolves.toEqual({ status: 'fallback', reason: 'react-native-codegen' });
});

it('keeps React Native Codegen candidates out of the full native Metro path', async () => {
  await expect(
    transformFileFullyWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
export default codegenNativeComponent("NativeValue");`,
      options: options(),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    })
  ).resolves.toEqual({ status: 'fallback', reason: 'react-native-codegen' });
});

it('falls back when the default transformer is extended by a project Babel config', async () => {
  await expect(
    transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: 'module.exports = <View />;',
      options: options(),
      isDefaultExpoTransformer: true,
      hasNonDefaultBabelConfig: true,
    })
  ).resolves.toEqual({
    status: 'fallback',
    reason: 'non-default-babel-config',
  });
});

it.each([
  ['web', { platform: 'web' as const, unstable_transformProfile: 'default' as const }],
  ['Hermes v1', { platform: 'ios' as const, unstable_transformProfile: 'hermes-stable' as const }],
])('does not compile %s node_modules', async (_name, target) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: '/app/node_modules/example/index.js',
    projectRoot: '/app',
    source: 'module.exports = function Component() { return null; };',
    options: options({
      ...target,
      customTransformOptions: { engine: 'hermes', reactCompiler: 'true' },
    }),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('react/compiler-runtime');
});

it('keeps compiled Expo workspace client directives on the Babel path', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: '/repo/packages/expo-router/build/value.js',
    projectRoot: '/repo/apps/example',
    source: `'use client'; module.exports = 1;`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
  });
  expect(result).toEqual({ status: 'fallback', reason: 'expo-directive' });
});

it('creates React Server client proxies natively', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: '/repo/packages/expo-router/build/value.js',
    projectRoot: '/repo/apps/example',
    source: `'use client';
      export const value = 1;
      export default function Component() { return null; }`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('createClientModuleProxy');
  expect(result.result.code).toContain('registerClientReference');
  expect(result.result.code).not.toContain('function Component');
  expect(result.result.metadata.proxyExports).toEqual(['value', 'default']);
  expect(result.result.metadata.reactClientReference).toBe(
    'file:///repo/packages/expo-router/build/value.js'
  );
});

it.each(['use client', 'use dom'])(
  "matches Babel's React Server proxy metadata for %s",
  async (directive) => {
    const candidate = '/app/src/client.tsx';
    const source = `"${directive}";
      export const value: number = 1;
      export class View {}
      export { value as alias };
      export default function Component() { return null; }`;
    const native = await transformFileFullyWithNoxcturnal({
      filename: candidate,
      projectRoot: '/app',
      source,
      options: options({
        customTransformOptions: {
          engine: 'hermes',
          environment: 'react-server',
        },
      }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });
    const babelResult = babel.transformSync(source, {
      filename: candidate,
      babelrc: false,
      configFile: false,
      comments: false,
      presets: [[babelPresetExpo, { reanimated: false }]],
      caller: {
        name: 'metro',
        engine: 'hermes',
        platform: 'ios',
        projectRoot: '/app',
        isDev: false,
        isServer: true,
        isReactServer: true,
        supportsStaticESM: true,
      } as babel.TransformCaller,
    });

    expect(native.status).toBe('complete');
    if (native.status !== 'complete') return;
    const babelMetadata = babelResult?.metadata as
      | {
          proxyExports?: string[];
          reactClientReference?: string;
        }
      | undefined;
    expect(native.result.metadata.proxyExports).toEqual(babelMetadata?.proxyExports);
    expect(native.result.metadata.reactClientReference).toBe(babelMetadata?.reactClientReference);
    expect(native.result.code).toContain('createClientModuleProxy("./src/client.tsx")');
    expect(native.result.code).not.toContain('value: number');
  }
);

it("keeps conflicting React Server directives on Babel's diagnostic path", async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/conflict.js',
    projectRoot: '/app',
    source: `"use client"; "use server"; export const value = 1;`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('fallback');
  if (result.status !== 'fallback') return;
  expect(result.reason).toContain('conflicting-client-server-directives');
});

it("matches Babel's client-side server reference proxy", async () => {
  const candidate = '/app/actions/save.ts';
  const source = `"use server";
    export async function save() { return 1; }
    export const remove = async () => 2;
    export default async function reset() { return 3; }`;
  const native = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source,
    options: options({
      experimentalImportSupport: false,
      customTransformOptions: { engine: 'hermes' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  const babelResult = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    comments: false,
    presets: [[babelPresetExpo, { reanimated: false }]],
    caller: {
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      projectRoot: '/app',
      isDev: false,
      isServer: false,
      isReactServer: false,
      supportsStaticESM: true,
    } as babel.TransformCaller,
  });
  const babelMetadata = babelResult?.metadata as
    | { proxyExports?: string[]; reactServerReference?: string }
    | undefined;

  expect(native.status).toBe('complete');
  if (native.status !== 'complete') return;
  expect(native.result.metadata.proxyExports).toEqual(babelMetadata?.proxyExports);
  expect(native.result.metadata.reactServerReference).toBe(babelMetadata?.reactServerReference);
  expect(native.result.code).toContain('createServerReference');
  expect(native.result.code).toContain('./actions/save.ts#save');
  expect(native.result.code).not.toContain('return 1');
});

it('retains inline client-bundle server actions for Babel', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/actions/inline.ts',
    projectRoot: '/app',
    source: `export const save = async () => { "use server"; return 1; };`,
    options: options({ customTransformOptions: { engine: 'hermes' } }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('fallback');
  if (result.status !== 'fallback') return;
  expect(result.reason).toContain('expo-client-server-directive-boundary:expo-directive');
});

it.each([false, true])("matches Babel's native DOM component proxy in dev=%s", async (dev) => {
  const candidate = '/app/components/Card.tsx';
  const source = `"use dom";
      export type Props = { title: string };
      export default function Card(props: Props) { return <main>{props.title}</main>; }`;
  const native = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source,
    options: options({
      dev,
      experimentalImportSupport: false,
      customTransformOptions: { engine: 'hermes' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  const babelResult = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    comments: false,
    presets: [[babelPresetExpo, { reanimated: false }]],
    caller: {
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      projectRoot: '/app',
      isDev: dev,
      isServer: false,
      isReactServer: false,
      supportsStaticESM: true,
    } as babel.TransformCaller,
  });
  const babelMetadata = babelResult?.metadata as { expoDomComponentReference?: string } | undefined;

  expect(native.status).toBe('complete');
  if (native.status !== 'complete') return;
  expect(native.result.metadata.expoDomComponentReference).toBe(
    babelMetadata?.expoDomComponentReference
  );
  expect(native.result.code).toContain('expo/dom/internal');
  if (dev) expect(native.result.code).toContain('DOM(Card)');
  expect(native.result.code).toContain(dev ? 'Card.tsx?file=' : '.html');
  expect(native.result.code).not.toContain('<main>');
});

it.each([
  ['named export', `"use dom"; export const value = 1; export default null;`, undefined],
  ['missing default', `"use dom"; const value = 1;`, undefined],
  [
    'layout route',
    `"use dom"; export default function Layout() { return null; }`,
    '/app/_layout.tsx',
  ],
])(
  "keeps invalid DOM component %s on Babel's diagnostic path",
  async (_name, source, filenameOverride) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename: filenameOverride ?? '/app/components/Card.tsx',
      projectRoot: '/app',
      source,
      options: options({ customTransformOptions: { engine: 'hermes' } }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });

    expect(result.status).toBe('fallback');
    if (result.status !== 'fallback') return;
    expect(result.reason).toContain('dom-component-');
  }
);
