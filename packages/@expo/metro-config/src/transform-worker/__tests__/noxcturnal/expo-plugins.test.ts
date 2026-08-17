import * as babel from '@babel/core';
import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  defineNativePlugin,
  defineNativePipeline,
  defineVisitor,
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
import { createExpoRouterServerExportsPlugin } from '../../noxcturnal/plugins/expo-router-server-exports';

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
  ['an import', `import value from "value"; global.value = value;`],
  ['an export', `export const value = 1;`],
])('falls back from the full native script path for %s', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '\0polyfill:test',
    projectRoot: '/repo/apps/example',
    source,
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result).toEqual({
    status: 'fallback',
    reason: expect.stringMatching(/script-(?:import|export)$/),
  });
});

it('completes eligible production application source through the full native Metro path', async () => {
  const appFilename = '/app/src/App.tsx';
  const source = `
type Props = { name: string };
const React = require('react');
function App({ name }: Props) {
  return <View accessibilityLabel={name}>{name}</View>;
}
module.exports = App;`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: appFilename,
    projectRoot: '/app',
    source,
    options: options(),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map((dependency) => dependency.name)).toEqual(
    expect.arrayContaining(['react', 'react/jsx-runtime'])
  );
  expect(result.result.code).not.toMatch(/\btype Props\b|<View/);
  const mappedExport = originalPositionFor(
    new TraceMap({
      version: 3,
      sources: [appFilename],
      ...result.result.map,
    } as any),
    generatedPositionOf(result.result.code, 'module.exports')
  );
  expect(mappedExport.line).toBe(7);
});

it('completes plain production application JavaScript through the native path', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/config.js',
    projectRoot: '/app',
    source: `export { value } from './value';`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['./value']);
  expect(result.result.code).toContain('__d(function');
});

it('removes loader and metadata exports from a native client route', async () => {
  const route = '/app/app/route.js';
  const result = await transformFileFullyWithNoxcturnal({
    filename: route,
    projectRoot: '/app',
    source: `export async function loader() { return null; }
      export const generateMetadata = () => ({}), keep = 1;`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/\bloader\b|generateMetadata/);
  expect(result.result.code).toContain('keep');
  expect(result.result.metadata).toMatchObject({
    loaderReference: route,
    performConstantFolding: true,
  });
});

it.each([
  ['sibling source', '/app/src/route.js', 'app'],
  ['dot-dot-prefixed sibling', '/app/app-other/route.js', 'app'],
  ['relative parent escape', '/app/route.js', 'app/nested'],
  ['absolute custom root', '/app/custom/route.js', '/app/other'],
] as const)(
  'keeps Router server exports outside the configured root for %s',
  (_name, candidate, routerRoot) => {
    const source = `export default function Route() {}
    export async function loader() { return null; }
    export const generateMetadata = () => ({}), keep = 1;`;
    const input = {
      filename: candidate,
      projectRoot: '/app',
      source,
      options: options({
        customTransformOptions: { engine: 'hermes', routerRoot, isLoaderBundle: 'true' },
      }),
      isDefaultExpoTransformer: true,
    };
    const result = transformWithNoxcturnal(
      source,
      candidate,
      defineNativePipeline({
        phases: [
          {
            name: 'router-server-exports',
            plugins: [
              createExpoRouterServerExportsPlugin({ defineNativePlugin, defineVisitor } as any),
            ],
          },
        ],
      }),
      { pluginData: { input } }
    );

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.code).toBe(source);
    expect(result.metadata.loaderReference).toBeUndefined();
    expect(result.metadata.performConstantFolding).toBeUndefined();
  }
);

it.each([
  ['relative custom root', '/app/routes/route.js', 'routes'],
  ['decoded absolute custom root', '/app/custom root/route.js', '/app/custom%20root'],
] as const)(
  'applies Router server exports inside the configured root for %s',
  (_name, candidate, routerRoot) => {
    const source = `export default function Route() {}
    export async function loader() { return null; }
    export function helper() {}`;
    const input = {
      filename: candidate,
      projectRoot: '/app',
      source,
      options: options({
        customTransformOptions: { engine: 'hermes', routerRoot, isLoaderBundle: 'true' },
      }),
      isDefaultExpoTransformer: true,
    };
    const result = transformWithNoxcturnal(
      source,
      candidate,
      defineNativePipeline({
        phases: [
          {
            name: 'router-server-exports',
            plugins: [
              createExpoRouterServerExportsPlugin({ defineNativePlugin, defineVisitor } as any),
            ],
          },
        ],
      }),
      { pluginData: { input } }
    );

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.code).toContain('loader');
    expect(result.code).not.toMatch(/\bRoute\b|\bhelper\b/);
    expect(result.metadata.loaderReference).toBe(candidate);
  }
);

it.each(['/app/app/..admin.tsx', '/app/app/..internal/route.ts'])(
  'treats the dot-dot-prefixed descendant %s as a native client route',
  async (route) => {
    const source = `export async function loader() { return null; }
      export const generateMetadata = () => ({}), keep = 1;`;
    const result = await transformFileFullyWithNoxcturnal({
      filename: route,
      projectRoot: '/app',
      source,
      options: options({ dev: false }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).not.toMatch(/\bloader\b|generateMetadata/);
    expect(result.result.code).toContain('keep');
    expect(result.result.metadata.loaderReference).toBe(route);

    const babelResult = transformWithBabelPreset(source, route);
    expect(babelResult.code).not.toMatch(/\bloader\b|generateMetadata/);
    expect(babelResult.code).toContain('keep');
    expect(babelResult.metadata).toMatchObject({
      loaderReference: route,
      performConstantFolding: true,
    });
  }
);

it.each([
  ['node_modules', '/app/node_modules/example/index.js', undefined],
  ['Node server source', '/app/src/server.js', 'node'],
  ['React Server source', '/app/src/server.js', 'react-server'],
] as const)(
  'matches Babel preset Expo by keeping React Compiler off %s',
  async (_name, candidate, environment) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename: candidate,
      projectRoot: '/app',
      source: 'module.exports = function Component() { return null; };',
      options: options({
        unstable_transformProfile: 'default',
        customTransformOptions: { engine: 'hermes', reactCompiler: 'true', environment },
      }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).not.toContain('react/compiler-runtime');
  }
);

it('keeps only loader exports in a native loader bundle', async () => {
  const route = '/app/app/route.js';
  const result = await transformFileFullyWithNoxcturnal({
    filename: route,
    projectRoot: '/app',
    source: `export default function Route() {}
      export async function loader() { return null; }
      export function helper() {}`,
    options: options({
      dev: false,
      customTransformOptions: { engine: 'hermes', isLoaderBundle: 'true' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result).toMatchObject({ status: 'complete' });
  expect(result.result.code).toContain('loader');
  expect(result.result.code).not.toMatch(/\bRoute\b|\bother\b|\bhelper\b/);
  expect(result.result.metadata.loaderReference).toBe(route);
});

it('does not classify identifiers nested in exported destructuring as Router server exports', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/app/route.js',
    projectRoot: '/app',
    source: `const source = { loader: 1 };
      export const { /* binding */ loader: nestedLoader } = source;`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('nestedLoader');
  expect(result.result.metadata.loaderReference).toBeUndefined();
});

it('retains generateMetadata in a native Node route', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/app/route.js',
    projectRoot: '/app',
    source: `export function generateMetadata() { return {}; }
      export const value = 1;`,
    options: options({
      dev: false,
      customTransformOptions: { engine: 'hermes', environment: 'node' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('generateMetadata');
  expect(result.result.code).toContain('value');
});

it.each(['ios', 'web'] as const)(
  'inlines the Expo manifest on the native %s path',
  async (platform) => {
    const previousManifest = process.env.APP_MANIFEST;
    process.env.APP_MANIFEST = '{"name":"native"}';
    try {
      const result = await transformFileFullyWithNoxcturnal({
        filename: '/app/src/constants.js',
        projectRoot: '/app',
        source: `export const manifest = process.env.APP_MANIFEST;
        process.env.APP_MANIFEST = "preserved";
        process.env.APP_MANIFEST++;
        delete (process.env.APP_MANIFEST);
        ({ value: process.env.APP_MANIFEST } = input);
        for (process.env.APP_MANIFEST in input) {}
        for (process.env.APP_MANIFEST of input) {}`,
        options: options({ dev: false, platform }),
        isDefaultExpoTransformer: true,
        config: fullConfig(),
      });

      expect(result.status).toBe('complete');
      if (result.status !== 'complete') return;
      expect(result.result.code).toContain(String.raw`{\"name\":\"native\"}`);
      expect(result.result.code).toContain('process.env.APP_MANIFEST = "preserved"');
      expect(result.result.code).toContain('process.env.APP_MANIFEST++');
      expect(result.result.code).toMatch(/delete\s+\(?process\.env\.APP_MANIFEST\)?/);
      expect(result.result.code).toMatch(/value:\s*process\.env\.APP_MANIFEST/);
      expect(result.result.code).toContain('for (process.env.APP_MANIFEST in input)');
      expect(result.result.code).toContain('for (process.env.APP_MANIFEST of input)');
    } finally {
      if (previousManifest === undefined) delete process.env.APP_MANIFEST;
      else process.env.APP_MANIFEST = previousManifest;
    }
  }
);

it('uses the Babel WebView preflight for DOM components', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/dom-component.js',
    projectRoot: '/app',
    source: `function decorate(value) { return value; }
      @decorate class Example {
        field = 1;
        static { this.ready = true; }
        method(value = this?.field ?? 0) {
          let output;
          output ||= value;
          for (const item of [value]) output += item;
          return output;
        }
      }
      module.exports = Example;`,
    options: options({
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes', dom: 'true' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/@decorate|\?\.|\?\?|\|\|=|\bclass Example\b/);
  expect(result.result.code).toContain('decorate');
});

it('matches Babel by lowering object spread for a modern non-Hermes target', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/web.js',
    projectRoot: '/app',
    source: 'module.exports = { ...source, value: 1 };',
    options: options({ platform: 'web', customTransformOptions: { engine: undefined } }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('...source');
});

it('matches Babel by preserving async generators on modern web targets', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/web.js',
    projectRoot: '/app',
    source: 'module.exports = async function* values() { yield 1; };',
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('async function*');
});

it('matches Babel by preserving for-of outside the WebView profile', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/native.js',
    projectRoot: '/app',
    source: 'for (const value of values) consume(value);',
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(' of ');
});

it('preserves comments while applying Hermes v1 block scoping', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/native.js',
    projectRoot: '/app',
    source: '/* keep */ const value = 1; module.exports = value;',
    options: options({ minify: false, unstable_transformProfile: 'hermes-stable' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('/* keep */');
});

it('matches Babel by leaving legacy React display names off modern web targets', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/web.js',
    projectRoot: '/app',
    source: 'const Component = createReactClass({ render() {} }); module.exports = Component;',
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('displayName');
});

it('matches Babel by skipping React Native Codegen on modern web targets', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/NativeValue.tsx',
    projectRoot: '/app',
    source: `import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
      export default codegenNativeComponent<{ value: string }>("NativeValue");`,
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
});

it('selects the native iOS @expo/ui icon without collecting the Android asset', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/icon.js',
    projectRoot: '/app',
    source: `import { Icon as ExpoIcon } from '@expo/ui';
      export const icon = ExpoIcon.select({
        ios: 'heart.fill',
        android: import('./heart.xml'),
      });`,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('heart.fill');
  expect(result.result.code).not.toMatch(/Icon\.select|heart\.xml/);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['@expo/ui']);
});

it('selects and statically collects the native Android @expo/ui icon asset', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/icon.js',
    projectRoot: '/app',
    source: `import * as ExpoUI from '@expo/ui';
      export const icon = ExpoUI.Icon.select({
        ios: 'heart.fill',
        android: import('./heart.xml'),
      });`,
    options: options({ dev: false, platform: 'android' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/Icon\.select|heart\.fill|import\(/);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['@expo/ui', './heart.xml']);
});

it('preserves unsupported @expo/ui Icon.select object shapes', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/icon.js',
    projectRoot: '/app',
    source: `import { Icon } from '@expo/ui';
      const shared = { android: 1 };
      export const icon = Icon.select({ ios: 'heart.fill', ...shared });`,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('select');
  expect(result.result.code).toContain('heart.fill');
});

it('does not impose a blanket Babel boundary on compiled @expo/ui modules', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/node_modules/@expo/ui/build/runtime.js',
    projectRoot: '/app',
    source: `export const value = require('./value');`,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['./value']);
});

it('stringifies widget functions after native JSX lowering', async () => {
  const source = `export function Greeting({ name }: { name: string }) {
    'widget';
    return <Text>{name + \` hello\`}</Text>;
  }`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/widget.tsx',
    projectRoot: '/app',
    source,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain("'widget'");
  expect(result.result.code).toContain('var Greeting = `function');
  expect(result.result.code).toContain('jsx');
  const babelResult = transformWithBabelPreset(source, '/app/src/widget.tsx');
  const nativeTemplate = /`((?:\\.|[^`])*)`/.exec(result.result.code)?.[1];
  const babelTemplate = /`((?:\\.|[^`])*)`/.exec(babelResult.code!)?.[1];
  expect(nativeTemplate).toBe(babelTemplate);
});

it('stringifies widget arrows, object methods, and default exports', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/widgets.js',
    projectRoot: '/app',
    source: `export const Arrow = (value) => {
      'widget';
      return value;
    };
    export const registry = {
      Method(value) {
        'widget';
        return value;
      }
    };
    export default function DefaultWidget(value) {
      'widget';
      return value;
    }`,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain("'widget'");
  expect(result.result.code.match(/`function/g)).toHaveLength(3);
});

it.each([
  ['import', `import value from "server-only";`],
  ['re-export', `export { value } from "server-only";`],
  ['export all', `export * from "server-only";`],
  ['require', `require("server-only");`],
  ['resolve weak', `require.resolveWeak("server-only");`],
  ['dynamic import', `import("server-only");`],
])('precisely rejects a restricted client %s', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/client.js',
    projectRoot: '/app',
    source,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result).toEqual({
    status: 'fallback',
    reason:
      'expo-environment-restricted-imports-server-only:environment-restricted-import:server-only',
  });
});

it('does not bail out for an ordinary server-only string', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/client.js',
    projectRoot: '/app',
    source: `module.exports = "server-only";`,
    options: options({ dev: false, platform: 'ios' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('"server-only"');
});

it.each([
  ['import', `import value from "client-only";`],
  ['re-export', `export { value } from "client-only";`],
  ['export all', `export * from "client-only";`],
  ['require', `require("client-only");`],
  ['dynamic import', `import("client-only");`],
])('precisely rejects a restricted React server %s', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('fallback');
  if (result.status !== 'fallback') return;
  expect(result.reason).toContain(
    'expo-environment-restricted-imports-client-only:environment-restricted-import:client-only'
  );
});

it.each([
  [
    'named class import',
    `import { Component } from "react"; export class App extends Component {}`,
    'react-server-client-api-import:react:Component',
  ],
  [
    'named hook use',
    `import { useState } from "react"; const state = useState(0);`,
    'react-server-client-api-use:useState',
  ],
  [
    'namespace hook use',
    `import * as React from "react"; const state = React.useState(0);`,
    'react-server-client-api-use:react:useState',
  ],
  [
    'default react-dom API use',
    `import ReactDOM from "react-dom"; ReactDOM.flushSync(() => {});`,
    'react-server-client-api-use:react-dom:flushSync',
  ],
])("matches Babel's restricted React API boundary for %s", async (_name, source, reason) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
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

  expect(result.status).toBe('fallback');
  if (result.status !== 'fallback') return;
  expect(result.reason).toContain(reason);
});

it('completes an ordinary React server module and permits unused hook imports', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.tsx',
    projectRoot: '/app',
    source: `import { useState } from "react";
      import "server-only";
      export default function Page(): JSX.Element { return <main>server</main>; }`,
    options: options({
      experimentalImportSupport: false,
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('<main>');
  expect(result.result.code).toContain('Object.defineProperty(exports, "default"');
});

it('extracts no-capture inline arrow server actions natively', async () => {
  const candidate = '/app/src/server.js';
  const source = `export const action = async () => { "use server"; return 1; };`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  const babelResult = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    comments: true,
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
  const babelMetadata = babelResult?.metadata as
    | { reactServerActions?: { id: string; names: string[] } }
    | undefined;

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('registerServerReference');
  expect(result.result.code).toMatch(/_\$\$INLINE_ACTION/);
  expect(result.result.code).not.toContain('"use server"');
  expect(result.result.metadata.reactServerActions).toEqual(babelMetadata?.reactServerActions);
});

it('extracts no-capture inline function-expression server actions natively', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source: `export const action = async function named(value) { "use server"; return value; };`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('async function named(value)');
  expect(result.result.code).toMatch(/_\$\$INLINE_ACTION/);
  expect(result.result.code).not.toContain('"use server"');
});

it('extracts top-level inline function-declaration server actions natively', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source: `export async function action(value) { "use server"; return value; }`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('async function action(value)');
  expect(result.result.code).toMatch(/_\$\$INLINE_ACTION/);
  expect(result.result.code).not.toContain('"use server"');
});

it('extracts captured inline server actions with lazy bound arguments', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source: `export function factory(value) {
      return async () => { "use server"; return value; };
    }`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('.bind(null,');
  expect(result.result.code).toContain('get value()');
  expect(result.result.code).toMatch(/var \[value\] = .+\.value/);
  expect(result.result.code).not.toContain('"use server"');
});

it.each([
  {
    name: 'arrow',
    action: 'async () => { "use server"; return block + local + local + program; }',
  },
  {
    name: 'function expression',
    action: 'async function action() { "use server"; return block + local + local + program; }',
  },
])('captures non-Program bindings once for inline $name server actions', async ({ action }) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source: `const program = 1;
      { const block = 2;
        module.exports = function factory(local) { return ${action}; };
      }`,
    options: options({
      customTransformOptions: {
        engine: 'hermes',
        environment: 'react-server',
      },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toMatch(/var \[block, local\] = .+\.value/);
  expect(result.result.code).toMatch(/\(\) => \[block, local\]/);
  expect(result.result.code).not.toMatch(/var \[[^\]]*program[^\]]*\] =/);
});

it('captures a lexical binding that shadows a same-named Program binding', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/server.js',
    projectRoot: '/app',
    source: `const value = 'program';
      module.exports = function factory() {
        const value = 'lexical';
        return async () => { "use server"; return value + value; };
      };`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toMatch(/var \[value\] = .+\.value/);
  expect(result.result.code).toMatch(/\(\) => \[_?value\]/);
});

it("matches Babel's module-level React Server action registrations", async () => {
  const candidate = '/app/actions/server.ts';
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
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  const babelResult = babel.transformSync(source, {
    filename: candidate,
    babelrc: false,
    configFile: false,
    comments: true,
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
  const babelMetadata = babelResult?.metadata as
    | {
        reactServerActions?: { id: string; names: string[] };
        reactServerReference?: string;
      }
    | undefined;

  expect(native.status).toBe('complete');
  if (native.status !== 'complete') return;
  expect(native.result.metadata.reactServerActions).toEqual(babelMetadata?.reactServerActions);
  expect(native.result.metadata.reactServerReference).toBe(babelMetadata?.reactServerReference);
  expect(native.result.code).toContain('registerServerReference');
  expect(native.result.code).toContain('./actions/server.ts');
  expect(native.result.code).not.toContain('"use server"');
});

it('retains unsupported module-level React Server action forms for Babel', async () => {
  for (const source of [
    `"use server"; export function syncAction() { return 1; }`,
    `"use server"; export default function syncAction() { return 1; }`,
  ]) {
    const result = await transformFileFullyWithNoxcturnal({
      filename: '/app/actions/server.ts',
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

    expect(result.status).toBe('fallback');
    if (result.status !== 'fallback') continue;
    expect(result.reason).toContain('server-action-non-async-function');
  }
});

it.each([
  ['anonymous function', `"use server"; export default async function(value) { return value; }`],
  [
    'anonymous function with whitespace',
    `"use server"; export default async function (value) { return value; }`,
  ],
  [
    'anonymous function with an anchor comment',
    `"use server"; export default async function/* anchor */(value) { return value; }`,
  ],
  [
    'anonymous function with a multiline anchor comment',
    `"use server"; export default async function\n/* anchor */\n(value) { return value; }`,
  ],
  ['anonymous arrow', `"use server"; export default async (value) => value;`],
  ['bound identifier', `"use server"; const action = async () => 1; export default action;`],
])('supports module-level React Server %s defaults', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/actions/default.ts',
    projectRoot: '/app',
    source,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('registerServerReference');
  expect(result.result.metadata.reactServerActions).toEqual({
    id: './actions/default.ts',
    names: ['default'],
  });
});

it('registers the same anonymous server action that it exports by default', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/actions/default.ts',
    projectRoot: '/app',
    source: `"use server"; export default async function(value) { return value; }`,
    options: options({
      customTransformOptions: { engine: 'hermes', environment: 'react-server' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;

  let factory: Function | undefined;
  new Function('__d', result.result.code)((value: Function) => {
    factory = value;
  });
  let registered: Function | undefined;
  const registerServerReference = (value: Function) => {
    registered = value;
    return value;
  };
  const moduleExports: { default?: Function } = {};
  factory?.(
    globalThis,
    () => ({ registerServerReference }),
    (value: unknown) => value,
    (value: unknown) => value,
    { exports: moduleExports },
    moduleExports,
    []
  );
  expect(registered).toBe(moduleExports.default);
  await expect(moduleExports.default?.('value')).resolves.toBe('value');
});

it('completes eligible production Node application source through the native Metro path', async () => {
  const candidate = '/app/routes/render.tsx';
  const source = `import value from './value';
    export default function Render(): JSX.Element {
      return <main>{typeof window}:{value}</main>;
    }`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source,
    options: options({
      dev: false,
      customTransformOptions: { engine: 'hermes', environment: 'node' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name, data }) => [name, data.isESMImport])).toEqual(
    expect.arrayContaining([
      ['react/jsx-runtime', true],
      ['./value', true],
    ])
  );
  expect(result.dependencies).toHaveLength(2);
  expect(result.result.code).toContain(`"undefined"`);
  expect(result.result.code).not.toContain('JSX.Element');

  const babelResult = transformWithBabelPreset(source, candidate, false, true);
  expect(babelResult.code).toContain(`"undefined"`);
  expect(babelResult.code).not.toContain('JSX.Element');
  expect(babelResult.code).toContain('react/jsx-runtime');

  let factory: Function | undefined;
  Function(
    '__d',
    result.result.code
  )((value: Function) => {
    factory = value;
  });
  const modules: Record<string, unknown> = {
    './value': 7,
    'react/jsx-runtime': {
      jsx(type: string, props: Record<string, unknown>) {
        return { type, props };
      },
      jsxs(type: string, props: Record<string, unknown>) {
        return { type, props };
      },
    },
  };
  const module = { exports: {} as Record<string, unknown> };
  const dependencyMap = result.dependencies.map(({ name }) => name);
  factory!(
    globalThis,
    (_id: string, name?: string) => modules[name ?? _id],
    (id: string, name?: string) => {
      const value = modules[name ?? id] as {
        __esModule?: boolean;
        default?: unknown;
      };
      return value?.__esModule ? value.default : value;
    },
    (id: string, name?: string) => modules[name ?? id],
    module,
    module.exports,
    dependencyMap
  );
  const rendered = (module.exports.default as () => unknown)();
  expect(rendered).toEqual({
    type: 'main',
    props: { children: ['undefined', ':', 7] },
  });
});

it('completes ordinary production web TSX without invoking React Native Web', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/web/route.tsx',
    projectRoot: '/app',
    source: `import value from './value';
      export default function Route(): JSX.Element {
        return <main>{value}</main>;
      }`,
    options: options({
      dev: false,
      platform: 'web',
      unstable_transformProfile: 'default',
      customTransformOptions: { environment: undefined },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/JSX\.Element|<main>/);
  expect(result.dependencies.map(({ name }) => name)).toEqual(
    expect.arrayContaining(['./value', 'react/jsx-runtime'])
  );
});

it('lowers modern-web private features without lowering unrelated classes', async () => {
  const source = `class Unrelated { field = 1 }
    export default class Secret {
      #value = 2;
      #read(input) { return this.#value + input; }
      read(input) { return [this.#read(3), #value in input]; }
    }`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/Secret.js',
    projectRoot: '/app',
    source,
    options: options({
      dev: false,
      platform: 'web',
      unstable_transformProfile: 'default',
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('class Unrelated');
  expect(result.result.code).not.toMatch(/#(?:value|read)/);
  expect(result.result.code).toContain('Object.defineProperty');
});

it('rewrites React Native named imports on the native web path', async () => {
  const source = `import ReactNative, {
    View as WebView,
    unstable_createElement as createElement,
    Unknown as UnknownExport
  } from 'react-native';
  import * as ReactNativeWeb from 'react-native-web';
  export { Text as Label, Unknown as Other } from 'react-native';
  export default [ReactNative, WebView, createElement, UnknownExport, ReactNativeWeb];`;
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual([
    'react-native-web/dist/index',
    'react-native-web/dist/exports/View',
    'react-native-web/dist/exports/createElement',
    'react-native-web/dist/exports/Text',
  ]);
  const babel = transformWithBabelPlugin(source, 'babel-plugin-react-native-web');
  for (const moduleName of result.dependencies.map(({ name }) => name)) {
    expect(babel).toContain(moduleName);
  }
});

it('rewrites React Native CommonJS bindings on the native web path', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const { View: WebView, Unknown: UnknownAlias, Text } = require('react-native');
      let { AnotherUnknown } = require('react-native-web');
      const ReactNative = require('react-native-web');
      module.exports = [WebView, UnknownAlias, Text, AnotherUnknown, ReactNative];`,
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toMatch(/const WebView = [^;]+\.default;/);
  expect(result.result.code).toMatch(/const Text = [^;]+\.default;/);
  expect(result.result.code).toMatch(/const \{ Unknown: UnknownAlias \} = [^;]+;/);
  expect(result.result.code).toMatch(/let \{ AnotherUnknown \} = [^;]+;/);
  expect(result.dependencies.map(({ name }) => name)).toEqual([
    'react-native-web/dist/exports/View',
    'react-native-web/dist/exports/Text',
    'react-native-web/dist/index',
  ]);
});

it('leaves unsupported React Native CommonJS destructuring unchanged', async () => {
  const source = `
    const { View = fallback } = require('react-native');
    const { ...rest } = require('react-native-web');
    const { ['View']: computed } = require('react-native');
    const { View: { nested } } = require('react-native-web');
  `;
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['react-native', 'react-native-web']);
  expect(result.result.code).toContain('{ View = fallback }');
  expect(result.result.code).toContain('{ ...rest }');
  expect(result.result.code).toContain('{ ["View"]: computed }');
  expect(result.result.code).toContain('{ View: { nested } }');
});

it('preserves React Native subpaths that the RNW Babel plugin does not rewrite', async () => {
  const source = 'react-native/Libraries/Utilities/Platform';
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = require(${JSON.stringify(source)});`,
    options: options({ platform: 'web' }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual([source]);
});

it('instruments development application source with native React Refresh', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '/app/src/App.js',
    projectRoot: '/app',
    source: `export default function App() { return null; }`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('$RefreshReg$');
  expect(result.result.code).toContain('"App"');
});

it('preserves development deep React Native import warnings', async () => {
  const candidate = '/app/src/deep-imports.js';
  const source = `import View from "react-native/Libraries/Components/View/View";
    export { default as Text } from "react-native/Libraries/Text/Text";
    const Image = require("react-native/Libraries/Image/Image");
    require("react-native/Libraries/Core/InitializeCore");
    export default [View, Text, Image];`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source,
    options: options({
      dev: true,
      customTransformOptions: { engine: 'hermes' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(
    result.result.code.match(/Deep imports from the 'react-native' package are deprecated/g)
  ).toHaveLength(3);
  expect(result.result.code).toContain(`Source: ${candidate} 1:0`);
  expect(result.result.code).not.toContain(
    "deprecated ('react-native/Libraries/Core/InitializeCore')"
  );
});

it.each([
  ['Hermes stable', 'ios', 'hermes', 'hermes-stable'],
  ['Hermes canary', 'ios', 'hermes', 'hermes-canary'],
  ['Hermes legacy', 'ios', 'hermes', 'default'],
  ['web', 'web', 'hermes', 'default'],
  ['non-Hermes', 'ios', undefined, 'default'],
] as const)(
  'completes React Compiler application source through the native Metro path for %s',
  async (_name, platform, engine, unstable_transformProfile) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename: '/app/src/App.tsx',
      projectRoot: '/app',
      source: `type Props = { value: string };
      export function App({ value }: Props) { return <View>{value}</View>; }`,
      options: options({
        experimentalImportSupport: false,
        platform,
        unstable_transformProfile,
        customTransformOptions: { engine, reactCompiler: 'true' },
      }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toContain('react/compiler-runtime');
    expect(result.result.code).toContain('exports.App = App');
    expect(result.result.code).not.toContain('type Props');
    expect(result.result.code).not.toContain('<View');
  }
);
