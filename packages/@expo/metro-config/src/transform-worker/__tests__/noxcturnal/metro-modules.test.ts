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

const nativeCorpus = [
  {
    name: 'production TypeScript and constant folding',
    filename: '/app/node_modules/corpus/math.ts',
    source:
      'const answer: number = 20 + 22; module.exports = { answer, dead: false ? sideEffect() : 0 };',
    options: options({ dev: false }),
    anchor: 'answer',
    dependencies: [] as string[],
    runtime: { answer: 42, dead: 0 },
  },
  {
    name: 'development automatic JSX and Refresh',
    filename: '/app/components/Widget.tsx',
    source:
      'import React from "react"; export function Widget({value}: {value: number}) { return <span>{value}</span>; }',
    options: { ...options({ dev: true }), hot: true } as JsTransformOptions,
    anchor: 'Widget',
    dependencies: ['react', 'react/jsx-runtime'],
  },
  {
    name: 'production ESM live imports and exports',
    filename: '/app/node_modules/corpus/reexport.js',
    source:
      'import { value } from "source"; export const doubled = value * 2; export { other } from "target";',
    options: options({ dev: false }),
    anchor: 'doubled',
    dependencies: ['source', 'target'],
  },
  {
    name: 'development native Flow erasure and side-effect dependency',
    filename: '/app/node_modules/corpus/flow.js',
    source:
      '/* @flow */ import "setup"; type Value = number; const value: Value = 1; module.exports = value;',
    options: options({ dev: true }),
    anchor: 'value',
    dependencies: ['setup'],
  },
  {
    name: 'production dynamic import graph',
    filename: '/app/node_modules/corpus/lazy.js',
    source: 'export async function load() { return import("lazy"); }',
    options: options({ dev: false }),
    anchor: 'load',
    dependencies: ['lazy', 'metro-runtime'],
  },
] as const;

it.each(nativeCorpus)(
  'keeps corpus trace, graph, and completion stable for $name',
  async (fixture) => {
    const input = {
      filename: fixture.filename,
      projectRoot: '/app',
      source: fixture.source,
      options: fixture.options,
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    };
    const [first, repeated] = await Promise.all([
      transformFileFullyWithNoxcturnal(input),
      transformFileFullyWithNoxcturnal(input),
    ]);

    expect(first.status).toBe('complete');
    expect(repeated.status).toBe('complete');
    if (first.status !== 'complete' || repeated.status !== 'complete') return;

    expect(repeated.result.code).toBe(first.result.code);
    expect(repeated.result.map).toEqual(first.result.map);
    expect(repeated.dependencies).toEqual(first.dependencies);
    expect(first.dependencies.map(({ name }) => name)).toEqual(fixture.dependencies);
    expect(first.result.functionMap).toBeDefined();
    expect(first.result.map.mappings.length).toBeGreaterThan(0);

    const trace = new TraceMap({
      version: 3,
      sources: [fixture.filename],
      ...first.result.map,
    } as any);
    const mappedAnchor = generatedPositionsOf(first.result.code, fixture.anchor)
      .map((generated) => originalPositionFor(trace, generated))
      .find((original) => original.source === fixture.filename && original.line != null);
    expect(mappedAnchor).toBeDefined();

    if ('runtime' in fixture) {
      const stage = await transformNodeModuleWithNoxcturnal(input);
      expect(stage.status).toBe('complete');
      if (stage.status !== 'complete') return;
      const module = { exports: undefined as unknown };
      Function(
        'module',
        'exports',
        'sideEffect',
        stage.result.code
      )(module, module.exports, () => {
        throw new Error('dead branch executed');
      });
      expect(module.exports).toEqual(fixture.runtime);
    }
  }
);

it.each([
  ['variable', 'const Widget = createReactClass({ render() {} });', '"Widget"'],
  ['assignment member', 'exports.Widget = React.createClass({});', '"Widget"'],
  ['object property', 'const values = { Widget: createReactClass({}) };', '"Widget"'],
  ['nested declarator', 'const Widget = memo(createReactClass({}));', '"Widget"'],
  ['default export filename', 'export default createReactClass({});', '"example"'],
])('adds legacy React display names inferred from a %s', async (_name, source, name) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain(`displayName: ${name}`);
});

it('preserves explicit display names and leaves Hermes V1 display names untouched', async () => {
  const legacy = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'const Widget = createReactClass({ ["displayName"]: "Explicit" });',
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  const modern = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'const Widget = createReactClass({});',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (legacy.status === 'fallback') throw new Error(legacy.reason);
  if (modern.status === 'fallback') throw new Error(modern.reason);
  expect(legacy.result.code.match(/displayName/g)).toHaveLength(1);
  expect(legacy.result.code).toContain('"Explicit"');
  expect(modern.result.code).not.toContain('displayName');
});

it('strips Flow with native erasure without running a Babel transform', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */\nimport type { Value } from './types';\nconst value: Value = process.env.EXPO_OS;\nmodule.exports = value;`,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toContain('import type');
  expect(result.result.code).not.toContain(': Value');
  expect(result.result.code).toContain(`var value = "ios"`);
  expect(result.result.map.mappings.length).toBeGreaterThan(0);
});

it('accepts a Flow module that legitimately strips to empty output', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: '/** @flow */\nexport type Value = { answer: number };',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code.replace('/** @flow */', '').trim()).toBe('');
});

it.each([
  [
    'enum',
    'enum Direction { Up, Down }\nmodule.exports = Direction.Up;',
    /Mirrored\(\["Up",\s*"Down"\]\)/,
  ],
  [
    'component',
    "import * as React from 'react';\ncomponent Greeting(name: string) { return <div>{name}</div>; }\nmodule.exports = Greeting;",
    /function Greeting\(\{\s*name\s*\}\)/,
  ],
  [
    'hook',
    "import * as React from 'react';\nhook useThing(value: number): number { return value; }\nmodule.exports = useThing;",
    /function useThing\(value\)/,
  ],
])('lowers Flow %s syntax selected from the parsed Flow AST', async (_name, body, expected) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */\n${body}\n`,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toMatch(expected);
});

it('does not treat proposal keywords in prose as proposal syntax', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    // `enum`, `match`, `component`, `hook`, and `record` all appear here as
    // ordinary words. Proposal transforms are selected from parsed syntax, so
    // none of them may run — and none may alter the stripped output.
    source: `/** @flow */
// This component does not enumerate or match any record, and hooks nothing.
export function describe(value: number): string {
  return \`component \${value} enum match record hook\`;
}
`,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toMatch(/component \$\{value\} enum match record hook/);
});

it('preserves typed Flow parameter defaults through focused stripping', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */
function collect(value: unknown, nodes: Array<number> = [], depth: number = 0): Array<number> {
  nodes.push(depth);
  return nodes;
}
module.exports = collect("value");`,
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain(
    `nodes = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : []`
  );
  expect(result.result.code).toContain(
    `depth = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0`
  );
});

it('removes value-less Flow class fields before class lowering', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */
class Event {
  static +NONE: 0;
  +NONE: 0;
}
Object.defineProperty(Event, 'NONE', { value: 0 });
Object.defineProperty(Event.prototype, 'NONE', { value: 0 });
module.exports = new Event();`,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toContain('this.NONE = void 0');
  expect(result.result.code).not.toContain('Event.NONE = void 0');
});

it('preserves a value-bearing side-effect import through focused Flow stripping', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: "/** @flow */\nimport '../Core/InitializeCore';",
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain("import '../Core/InitializeCore'");
});

it('collects a Flow side-effect import in the complete Metro dependency graph', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: "/** @flow */\nimport '../Core/InitializeCore';",
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['../Core/InitializeCore']);
  expect(result.result.code).toContain('_$$_REQUIRE(_dependencyMap[0], "../Core/InitializeCore")');
});

it('continues Flow JSX through the consumer-owned native JSX capability', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */\nconst view: React.Node = <View title="hello" />;\nmodule.exports = view;`,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toMatch(/React\.Node|<View/);
  expect(result.result.code).toContain('react/jsx-runtime');
  expect(result.result.code).toContain('jsx(View');
});

it('collects native lowering helpers in the complete Metro path', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = async function* values() { yield 1 };`,
    options: options({ dev: true }),
    enableBabelRuntime: '7.24.0',
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/\basync\s+function\s*\*/);
  expect(result.dependencies.map(({ name }) => name)).toEqual([
    '@babel/runtime/helpers/wrapAsyncGenerator',
  ]);
  expect(result.result.code).toContain(
    '_$$_IMPORT_DEFAULT(_dependencyMap[0], "@babel/runtime/helpers/wrapAsyncGenerator")'
  );
});

it('collects static CommonJS dependencies and wraps a module without Babel', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const first = require('one');\nmodule.exports = [first, require("one"), require('two')];`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result).toMatchObject({ status: 'complete' });
  if (result.status !== 'complete') return;
  expect(result.result.code).toMatch(
    /__d\(function \(global,[\s\S]*var first = _\$\$_REQUIRE\(_dependencyMap\[0\], "one"\);[\s\S]*module\.exports = \[\s*first,\s*_\$\$_REQUIRE\(_dependencyMap\[0\], "one"\),\s*_\$\$_REQUIRE\(_dependencyMap\[1\], "two"\)\s*\];[\s\S]*\}\);/
  );
  expect(result.dependencies.map(({ name, data }) => [name, (data as any).imports])).toEqual([
    ['one', 2],
    ['two', 1],
  ]);
  expect(result.result.metadata.hasCjsExports).toBe(true);
  expect(result.result.map.mappings.length).toBeGreaterThan(0);
});

it('inlines stable top-level require aliases before native dependency collection', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const one = require("one"), kept = 2; module.exports = [one, one, kept];`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result).toMatchObject({ status: 'complete' });
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/\bone\s*=/);
  expect(result.result.code).toContain('var kept = 2;');
  expect(result.result.code.match(/_\$\$_REQUIRE\(_dependencyMap\[0\], "one"\)/g)).toHaveLength(2);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one']);
});

it('inlines require member aliases and respects nonInlinedRequires', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const member = require("one").value; const ignored = require("two"); module.exports = [member, ignored];`,
    options: options({
      dev: true,
      inlineRequires: true,
      nonInlinedRequires: ['two'],
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/\bmember\s*=/);
  expect(result.result.code).toContain(`_$$_REQUIRE(_dependencyMap[1], "one").value`);
  expect(result.result.code).toContain(`var ignored = _$$_REQUIRE`);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['two', 'one']);
});

it('does not share nonInlinedRequires between transforms', async () => {
  const source = `const one = require("one"); const two = require("two"); module.exports = [one, two];`;
  const transform = (nonInlinedRequires: string[]) =>
    transformFileFullyWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source,
      options: options({ dev: true, inlineRequires: true, nonInlinedRequires }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });

  const first = await transform(['one']);
  const second = await transform(['two']);

  if (first.status === 'fallback') throw new Error(first.reason);
  if (second.status === 'fallback') throw new Error(second.reason);
  expect(first.result.code).toMatch(/var one =/);
  expect(first.result.code).not.toMatch(/var two =/);
  expect(second.result.code).not.toMatch(/var one =/);
  expect(second.result.code).toMatch(/var two =/);
});

it('does not inline reassigned aliases or shadowed require calls', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const stable = require("one"); let reassigned = require("two"); reassigned = 3; function local(require) { const value = require("local"); return value; } module.exports = [stable, reassigned, local];`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/\bstable\s*=/);
  expect(result.result.code).toContain('var reassigned =');
  expect(result.result.code).toContain(`require("local")`);
  expect(result.dependencies.map(({ name }) => name)).toEqual(['two', 'one']);
});

it.each([
  ['assignment', 'binding.value = next;'],
  ['nested postfix update', 'binding.value.nested++;'],
  ['prefix update', '++binding.value;'],
  ['postfix update', 'binding.value++;'],
  ['compound assignment', 'binding.value += next;'],
  ['logical assignment', 'binding.value ||= next;'],
  ['delete', 'delete binding.value;'],
  ['optional delete', 'delete binding?.optional;'],
  ['parenthesized chain', 'delete (binding).value;'],
  ['destructuring target', '({ value: binding.value } = source);'],
  ['for-in target', 'for (binding.value in source) break;'],
  ['for-of target', 'for (binding.value of source) break;'],
] as const)('does not inline an alias used by a %s', async (_name, mutation) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const binding = require("one"); ${mutation} module.exports = binding;`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('var binding = _$$_REQUIRE');
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one']);
});

it('retains a mutated root while inlining an alias used only as its computed key', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const binding = require("one"); const key = require("key"); binding[key].nested++; module.exports = binding;`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('var binding = _$$_REQUIRE');
  expect(result.result.code).not.toMatch(/\bkey\s*=/);
  expect(result.result.code).toContain('binding[_$$_REQUIRE');
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one', 'key']);
});

it('handles repeated inline-require candidate names without repeating binding queries', async () => {
  const declarations = Array.from(
    { length: 200 },
    (_, index) => `var binding = require("dependency-${index}");`
  );
  const references = Array.from({ length: 200 }, () => 'binding').join(', ');
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `${declarations.join('\n')} module.exports = [${references}];`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('module.exports');
});

it('inlines large require sets without follow-up inspection batches', async () => {
  const aliases = Array.from(
    { length: 200 },
    (_, index) => `const dependency${index} = require("dependency-${index}");`
  );
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `${aliases.join('\n')}\nmodule.exports = dependency199;`,
    options: options({ dev: true, inlineRequires: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['dependency-199']);
});

it('compacts the complete Metro output without falling back to Babel', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const value = require("one");\nmodule.exports = value;`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: { ...fullConfig(), unstable_compactOutput: true },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('\n');
  expect(result.result.code).toContain('_$$_REQUIRE(_dependencyMap[0])');
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one']);
});

it('completes production constant folding and DCE in native code', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = [process.env.EXPO_OS, process.env.NODE_ENV, __DEV__, require("one")];`,
    options: options({ dev: false, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    enableBabelRuntime: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
      unstable_dependencyMapReservedName: null,
      unstable_disableModuleWrapping: false,
      unstable_allowRequireContext: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('"production"');
  expect(result.result.code).toContain('_$$_REQUIRE(_dependencyMap[0])');
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one']);
});

it.each([
  ['nested arithmetic', `const value = 1 + 2 * 3; module.exports = value;`],
  [
    'logical and conditional selection',
    `const value = (false || true) ? "kept" : sideEffect(); module.exports = value;`,
  ],
  [
    'fixed-point function removal',
    `function leaf() { return 7; } function dead() { return leaf(); } module.exports = 3;`,
  ],
  [
    'live function dependency',
    `function leaf() { return 7; } function live() { return leaf(); } module.exports = live();`,
  ],
  ['unsafe call preservation', `const value = (sideEffect(), 1 + 2); module.exports = value;`],
  ['string comparison', `module.exports = ["b" < "c", "10" < "2", "1" === 1, "1" == 1];`],
])("matches Metro's Babel optimization for %s", (_name, source) => {
  const metroOptimization = requireFromMetroConfig(
    '@expo/metro/metro-transform-plugins'
  ).constantFoldingPlugin;
  const babelResult = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    plugins: [metroOptimization],
  });
  const nativeResult = transformWithNoxcturnal(
    source,
    filename,
    defineNativePipeline({
      phases: [
        {
          name: 'metro-optimization',
          native: {
            optimize: {
              constantFolding: true,
              deadCodeElimination: true,
            },
          },
        },
      ],
    })
  );

  expect(nativeResult.status).toBe('complete');
  if (nativeResult.status !== 'complete' || babelResult?.code == null) return;
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    const sideEffects: string[] = [];
    Function(
      'module',
      'sideEffect',
      code
    )(module, () => {
      sideEffects.push('called');
      return 9;
    });
    return { exports: module.exports, sideEffects };
  };
  expect(evaluate(nativeResult.code)).toEqual(evaluate(babelResult.code));
  expect(nativeResult.code.includes('function dead')).toBe(
    babelResult.code.includes('function dead')
  );
  expect(nativeResult.code.includes('function leaf')).toBe(
    babelResult.code.includes('function leaf')
  );
});

it('collects optional dependencies and lets required uses dominate duplicates', async () => {
  const base = {
    filename,
    projectRoot: '/app',
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  } as const;

  await expect(
    transformFileFullyWithNoxcturnal({
      ...base,
      source: `module.exports = require('one')`,
    })
  ).resolves.toMatchObject({ status: 'complete' });
  const optional = await transformFileFullyWithNoxcturnal({
    ...base,
    source: `try { module.exports = require('one') } catch {}`,
  });
  expect(optional.status).toBe('complete');
  if (optional.status !== 'complete') return;
  expect(optional.dependencies[0]?.data.isOptional).toBe(true);
  expect(optional.result.code).toContain('"one"');

  const requiredDuplicate = await transformFileFullyWithNoxcturnal({
    ...base,
    source: `try { require('one') } catch {} module.exports = require('one')`,
  });
  expect(requiredDuplicate.status).toBe('complete');
  if (requiredDuplicate.status !== 'complete') return;
  expect(requiredDuplicate.dependencies).toHaveLength(1);
  expect(requiredDuplicate.dependencies[0]?.data.isOptional).toBe(false);

  const excluded = await transformFileFullyWithNoxcturnal({
    ...base,
    source: `try { module.exports = require('one') } catch {}`,
    config: {
      ...base.config,
      allowOptionalDependencies: { exclude: ['one'] },
    },
  });
  expect(excluded.status).toBe('complete');
  if (excluded.status !== 'complete') return;
  expect(excluded.dependencies[0]?.data.isOptional).toBeUndefined();
});

it('collects and rewrites weak dependencies without conflating them with sync requires', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = [require.resolveWeak('one'), require('one'), require.resolveWeak('one')];`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(
    `module.exports = [_dependencyMap[0], _$$_REQUIRE(_dependencyMap[1], "one"), _dependencyMap[0]];`
  );
  expect(
    result.dependencies.map(({ name, data }) => [name, data.asyncType, (data as any).imports])
  ).toEqual([
    ['one', 'weak', 2],
    ['one', null, 1],
  ]);
});

it('does not treat a shadowed require.resolveWeak call as a dependency', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `function read(require) { return require.resolveWeak('one'); } module.exports = read;`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies).toEqual([]);
  expect(result.result.code).toContain(`require.resolveWeak('one')`);
});

it('collects and rewrites worker resolution through the Metro async runtime', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = require.unstable_resolveWorker('worker-entry');`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(
    `module.exports = _$$_REQUIRE(_dependencyMap[1], "metro-runtime").unstable_resolve(_dependencyMap[0], _dependencyMap.paths);`
  );
  expect(
    result.dependencies.map(({ name, data }) => [name, data.asyncType, data.isESMImport])
  ).toEqual([
    ['worker-entry', 'worker', false],
    ['metro-runtime', null, false],
  ]);
});

it('collects require.context parameters and keeps distinct contexts separate', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = [require.context('./views'), require.context('./views', false, /a\\/b/gi, 'lazy')];`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_allowRequireContext: true,
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(
    `module.exports = [_$$_REQUIRE(_dependencyMap[0], "./views"), _$$_REQUIRE(_dependencyMap[1], "./views")];`
  );
  expect(result.dependencies.map(({ name, data }) => [name, data.contextParams])).toEqual([
    ['./views', { recursive: true, filter: { pattern: '.*', flags: '' }, mode: 'sync' }],
    [
      './views',
      {
        recursive: false,
        filter: { pattern: 'a\\/b', flags: 'gi' },
        mode: 'lazy',
      },
    ],
  ]);
});

it('leaves require.context untouched when the Metro feature is disabled', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = require.context('./views');`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_allowRequireContext: false,
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies).toEqual([]);
  expect(result.result.code).toContain(`require.context('./views')`);
});

it.each([
  ['dynamic import', `import('one')`, 'async', ''],
  ['prefetch import', `__prefetchImport('one')`, 'prefetch', '.prefetch'],
  [
    'maybe-sync import',
    `require.unstable_importMaybeSync('one')`,
    'maybeSync',
    '.unstable_importMaybeSync',
  ],
])(
  'collects and rewrites %s through the Metro async runtime',
  async (_label, source, type, method) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `module.exports = ${source};`,
      options: options({ dev: true }),
      isDefaultExpoTransformer: true,
      config: {
        allowOptionalDependencies: false,
        asyncRequireModulePath: 'metro-runtime',
        globalPrefix: '',
        unstable_compactOutput: false,
      },
    });

    if (result.status === 'fallback') throw new Error(result.reason);
    expect(result.result.code).toContain(
      `module.exports = _$$_REQUIRE(_dependencyMap[1], "metro-runtime")${method}(_dependencyMap[0], _dependencyMap.paths, "one");`
    );
    expect(
      result.dependencies.map(({ name, data }) => [name, data.asyncType, data.isESMImport])
    ).toEqual([
      ['one', type, true],
      ['metro-runtime', null, false],
    ]);
  }
);

it('deduplicates the generated async runtime dependency across import kinds', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = [import('one'), __prefetchImport('two')];`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(
    result.dependencies.map(({ name, data }) => [name, data.asyncType, (data as any).imports])
  ).toEqual([
    ['one', 'async', 1],
    ['metro-runtime', null, 2],
    ['two', 'prefetch', 1],
  ]);
});

it('collects optional dynamic imports and lets a required duplicate dominate', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = [import('one').catch(onReject), import('one')];`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies).toHaveLength(2);
  expect(result.dependencies[0]).toMatchObject({
    name: 'one',
    data: { asyncType: 'async', isOptional: false },
  });
  expect(result.dependencies[1]).toMatchObject({
    name: 'metro-runtime',
    data: { asyncType: null },
  });
  expect(result.dependencies[1]!.data.isOptional).toBeUndefined();
});

it.each([
  [`import('one').catch(onReject)`, true],
  [`import('one').then(onResolve).catch(onReject)`, true],
  [`import('one').then(onResolve, onReject)`, true],
  [`consume(import('one')).catch(onReject)`, false],
  [`import('one') + value.catch(onReject)`, false],
  [`import('one').catch(undefined)`, false],
  [`import('one').then(onResolve, null)`, false],
  [`import('one')["catch"](onReject)`, false],
  [`import('one').catch?.(onReject)`, false],
  [`import('one')?.catch(onReject)`, true],
  [`try { import('one'); } catch {}`, true],
  [`try /* comment */\n { import('one'); } catch {}`, true],
  [`try { { import('one'); } } catch {}`, false],
  [`try { if (condition) import('one'); } catch {}`, true],
  [`try { label: if (condition) import('one'); } catch {}`, false],
  [`try { label: if (condition) var value = import('one'); } catch {}`, false],
  [`try {} catch { import('one'); }`, false],
  [`try {} finally { import('one'); }`, false],
])('matches Metro optional dynamic-import semantics in %s', async (source, optional) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies[0]).toMatchObject({
    name: 'one',
    data: { asyncType: 'async' },
  });
  expect(result.dependencies[0]!.data.isOptional).toBe(optional || undefined);
  expect(result.dependencies[1]!.data.isOptional).toBeUndefined();
});

it('collects optional worker dependencies without making the runtime optional', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `try { require.unstable_resolveWorker('worker-entry'); } catch {}`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies[0]).toMatchObject({
    name: 'worker-entry',
    data: { asyncType: 'worker', isOptional: true },
  });
  expect(result.dependencies[1]).toMatchObject({
    name: 'metro-runtime',
    data: { asyncType: null },
  });
  expect(result.dependencies[1]!.data.isOptional).toBeUndefined();
});

it('honors optional dependency exclusions for dynamic imports and workers', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `try {
      import('excluded');
      require.unstable_resolveWorker('excluded-worker');
    } catch {}`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: { exclude: ['excluded', 'excluded-worker'] },
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name, data }) => [name, data.isOptional])).toEqual([
    ['excluded', undefined],
    ['metro-runtime', undefined],
    ['excluded-worker', undefined],
  ]);
});

it('collects optional weak and context dependencies', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `try {
      require.resolveWeak('weak-entry');
      require.context('./routes');
    } catch {}`,
    options: options({ dev: false }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
      unstable_allowRequireContext: true,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(
    result.dependencies.map(({ name, data }) => [name, data.asyncType, data.isOptional])
  ).toEqual([
    ['weak-entry', 'weak', true],
    ['./routes', null, true],
  ]);
  expect(result.result.code).toContain(`_$$_REQUIRE(_dependencyMap[1], "./routes")`);
});

it.each([`import(/* @metro-ignore */ 'one')`, `import(/* webpackIgnore: true */ 'one')`])(
  'leaves ignored dynamic imports uncollected in %s',
  async (source) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `module.exports = ${source};`,
      options: options({ dev: true }),
      isDefaultExpoTransformer: true,
      config: {
        allowOptionalDependencies: true,
        asyncRequireModulePath: 'metro-runtime',
        globalPrefix: '',
        unstable_compactOutput: false,
      },
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.dependencies).toEqual([]);
    expect(result.result.code).toContain(source);
  }
);

it.each([
  `/* @metro-ignore */ import('one')`,
  `import('one') /* webpackIgnore: true */`,
  `const annotation = '@metro-ignore'; import('one')`,
  "const annotation = `webpackIgnore: true`; import('one')",
  `/* unrelated @metro-ignore */ const value = 1; import('one')`,
])('does not treat non-inner annotation text as a dynamic-import ignore in %s', async (source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `module.exports = (() => { ${source} })();`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: true,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one', 'metro-runtime']);
});

it('does not infer optional dynamic-import semantics from unrelated source text', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `const text = ".catch("; module.exports = import("one");`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: { ...fullConfig(), allowOptionalDependencies: true },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one', 'metro-runtime']);
});

it('mirrors Expo define and import-meta transforms for eligible dependencies', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `
      var values = [process.env.EXPO_OS, process['env']['EXPO_OS'], process.env.EXPO_SERVER, process.env.NODE_ENV, __DEV__, Platform.OS];
      var registry = import.meta.url;
      var router = [process.env.EXPO_PROJECT_ROOT, process.env.EXPO_ROUTER_APP_ROOT, process.env.EXPO_ROUTER_IMPORT_MODE];
      var selected = Platform.select({ web: 'web', native: 'native', ios: 'ios' });
      function shadow(process, Platform, __DEV__) {
        return [process.env.EXPO_OS, Platform.OS, __DEV__];
      }
      process.env.NODE_ENV = 'test';
      process.env.NODE_ENV += suffix;
      process.env.NODE_ENV ||= fallback;
      process.env.NODE_ENV++;
      ++process.env.NODE_ENV;
      delete (process.env.NODE_ENV);
      ({ value: process.env.NODE_ENV } = values);
      for (process.env.NODE_ENV in values) {}
      for (process.env.NODE_ENV of values) {}
      module.exports = values;
    `,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(
    `var values = ["ios", "ios", false, "production", false, "ios"]`
  );
  expect(result.result.code).toContain('globalThis.__ExpoImportMetaRegistry.url');
  expect(result.result.code).toContain(`var router = ["/app", "../../app", "sync"]`);
  expect(result.result.code).toContain(`var selected = 'ios'`);
  expect(result.result.code).toContain('return [process.env.EXPO_OS, Platform.OS, __DEV__]');
  expect(result.result.code).toContain(`process.env.NODE_ENV = 'test'`);
  expect(result.result.code).toContain(`process.env.NODE_ENV += suffix`);
  expect(result.result.code).toContain(`process.env.NODE_ENV ||= fallback`);
  expect(result.result.code).toContain(`process.env.NODE_ENV++`);
  expect(result.result.code).toContain(`++process.env.NODE_ENV`);
  expect(result.result.code).toMatch(/delete\s+\(?process\.env\.NODE_ENV\)?/);
  expect(result.result.code).toMatch(/value:\s*process\.env\.NODE_ENV/);
  expect(result.result.code).toContain(`for (process.env.NODE_ENV in values)`);
  expect(result.result.code).toContain(`for (process.env.NODE_ENV of values)`);
  expect(result.result.metadata.hasCjsExports).toBe(true);
  expect(result.result.functionMap).toMatchObject({
    names: ['<global>', 'shadow'],
  });
});

it('uses the last duplicate Platform.select entry while preserving fallback precedence', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `
      var platform = Platform.select({ ios: 'first-ios', ios: 'last-ios' });
      var native = Platform.select({ native: 'first-native', native: 'last-native' });
      var fallback = Platform.select({ default: 'first-default', default: 'last-default' });
      var platformPrecedence = Platform.select({
        ios: 'first-ios', native: 'first-native', default: 'first-default',
        ios: 'last-ios', native: 'last-native', default: 'last-default'
      });
      var nativePrecedence = Platform.select({
        native: 'first-native', default: 'first-default',
        native: 'last-native', default: 'last-default'
      });
      var computed = Platform.select({ ['ios']: 'computed', ios: 'static' });
      var spread = Platform.select({ ...values, ios: 'static' });
    `,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(`var platform = 'last-ios'`);
  expect(result.result.code).toContain(`var native = 'last-native'`);
  expect(result.result.code).toContain(`var fallback = 'last-default'`);
  expect(result.result.code).toContain(`var platformPrecedence = 'last-ios'`);
  expect(result.result.code).toContain(`var nativePrecedence = 'last-native'`);
  expect(result.result.code).toContain(`var computed = Platform.select`);
  expect(result.result.code).toContain(`var spread = Platform.select`);
});

it('inlines EXPO_PUBLIC environment variables in production and preserves assignments', async () => {
  const previous = process.env.EXPO_PUBLIC_NOXCTURNAL_TEST;
  process.env.EXPO_PUBLIC_NOXCTURNAL_TEST = 'native-value';
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename: workspaceFilename,
      projectRoot: '/app',
      source: `var value = process.env.EXPO_PUBLIC_NOXCTURNAL_TEST; process.env.EXPO_PUBLIC_NOXCTURNAL_TEST = 'next';`,
      options: options(),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    if (result.status === 'complete') {
      expect(result.result.code).toBe(
        `var value = "native-value"; process.env.EXPO_PUBLIC_NOXCTURNAL_TEST = 'next';`
      );
    }
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_NOXCTURNAL_TEST;
    else process.env.EXPO_PUBLIC_NOXCTURNAL_TEST = previous;
  }
});

it('resolves only encountered public and Router environment properties', async () => {
  const previous = process.env.EXPO_PUBLIC_NOXCTURNAL_I19;
  process.env.EXPO_PUBLIC_NOXCTURNAL_I19 = 'native-value';
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename: workspaceFilename,
      projectRoot: '/app',
      source: `
        var key = 'EXPO_PUBLIC_NOXCTURNAL_I19';
        module.exports = [
          process.env.EXPO_PUBLIC_NOXCTURNAL_I19,
          process['env']['EXPO_PUBLIC_NOXCTURNAL_I19'],
          process.env?.EXPO_PUBLIC_NOXCTURNAL_I19,
          process.env?.['EXPO_PUBLIC_NOXCTURNAL_I19'],
          process.env.EXPO_PUBLIC_NOXCTURNAL_I19_UNSET,
          process.env[key],
          (() => { const process = { env: { EXPO_PUBLIC_NOXCTURNAL_I19: 'shadow' } }; return process.env.EXPO_PUBLIC_NOXCTURNAL_I19; })(),
          process.env.EXPO_ROUTER_APP_ROOT,
          process['env'].EXPO_ROUTER_ABS_APP_ROOT
        ];
      `,
      options: options({
        customTransformOptions: { engine: 'hermes', routerRoot: 'routes' },
      }),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toContain('"native-value"');
    expect(result.result.code.match(/"native-value"/g)).toHaveLength(4);
    expect(result.result.code).toContain('undefined');
    expect(result.result.code).toContain('process.env[key]');
    expect(result.result.code).toContain('EXPO_PUBLIC_NOXCTURNAL_I19: "shadow"');
    expect(result.result.code).toContain('"../../../routes"');
    expect(result.result.code).toContain('"/app/routes"');
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_NOXCTURNAL_I19;
    else process.env.EXPO_PUBLIC_NOXCTURNAL_I19 = previous;
  }
});

it('does not enumerate public environment variables while building a transform', async () => {
  const entries = jest.spyOn(Object, 'entries');
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `module.exports = process.env.EXPO_PUBLIC_NOXCTURNAL_UNSET;`,
      options: options(),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    expect(entries.mock.calls.some(([value]) => value === process.env)).toBe(false);
  } finally {
    entries.mockRestore();
  }
});

it.each([false, true])(
  'leaves ordinary public environment variables untouched in node modules with dev=%s',
  async (dev) => {
    const previous = process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY;
    process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY = 'private-app-value';
    try {
      const result = await transformNodeModuleWithNoxcturnal({
        filename,
        projectRoot: '/app',
        source: `module.exports = process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY;`,
        options: options({ dev }),
        isDefaultExpoTransformer: true,
      });

      expect(result.status).toBe('complete');
      if (result.status !== 'complete') return;
      expect(result.result.code).toContain('process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY');
      expect(result.result.code).not.toContain('private-app-value');
      expect(result.result.code).not.toContain('expo/virtual/env');
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY;
      else process.env.EXPO_PUBLIC_NOXCTURNAL_DEPENDENCY = previous;
    }
  }
);

it.each([
  [false, 'node'],
  [true, 'node'],
  [false, 'react-server'],
  [true, 'react-server'],
] as const)(
  'leaves public environment variables for the runtime in dev=%s %s bundles',
  async (dev, environment) => {
    const previous = process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER;
    process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER = 'build-time-value';
    try {
      const result = await transformNodeModuleWithNoxcturnal({
        filename: workspaceFilename,
        projectRoot: '/app',
        source: `module.exports = process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER;`,
        options: options({
          dev,
          customTransformOptions: { engine: 'hermes', environment },
        }),
        isDefaultExpoTransformer: true,
      });

      expect(result.status).toBe('complete');
      if (result.status !== 'complete') return;
      expect(result.result.code).toContain('process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER');
      expect(result.result.code).not.toContain('build-time-value');
      expect(result.result.code).not.toContain('expo/virtual/env');
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER;
      else process.env.EXPO_PUBLIC_NOXCTURNAL_SERVER = previous;
    }
  }
);

it('preserves the configured RN fetch exception for node modules', async () => {
  const previous = process.env.EXPO_PUBLIC_USE_RN_FETCH;
  process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `module.exports = process.env.EXPO_PUBLIC_USE_RN_FETCH;`,
      options: options({ dev: true }),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toBe(`module.exports = "1";`);
    expect(result.result.code).not.toContain('expo/virtual/env');
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_USE_RN_FETCH;
    else process.env.EXPO_PUBLIC_USE_RN_FETCH = previous;
  }
});

it('leaves the RN fetch exception untouched in node modules when unset', async () => {
  const previous = process.env.EXPO_PUBLIC_USE_RN_FETCH;
  delete process.env.EXPO_PUBLIC_USE_RN_FETCH;
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: `module.exports = process.env.EXPO_PUBLIC_USE_RN_FETCH;`,
      options: options(),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toContain('process.env.EXPO_PUBLIC_USE_RN_FETCH');
  } finally {
    if (previous !== undefined) process.env.EXPO_PUBLIC_USE_RN_FETCH = previous;
  }
});

it('references configured RN fetch through the virtual environment in development source', async () => {
  const previous = process.env.EXPO_PUBLIC_USE_RN_FETCH;
  process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';
  try {
    const result = await transformNodeModuleWithNoxcturnal({
      filename: workspaceFilename,
      projectRoot: '/app',
      source: `module.exports = process.env.EXPO_PUBLIC_USE_RN_FETCH;`,
      options: options({ dev: true }),
      isDefaultExpoTransformer: true,
    });

    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toContain('require("expo/virtual/env")');
    expect(result.result.code).not.toContain('module.exports = "1"');
    expect(result.result.metadata.publicEnvVars).toEqual(['EXPO_PUBLIC_USE_RN_FETCH']);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_USE_RN_FETCH;
    else process.env.EXPO_PUBLIC_USE_RN_FETCH = previous;
  }
});

it('references EXPO_PUBLIC environment variables through the virtual module in development', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: workspaceFilename,
    projectRoot: '/app',
    source: `var _env; function mutate(input) { process.env.EXPO_PUBLIC_API_URL++; process.env['EXPO_PUBLIC_API_URL']++; delete (process.env.EXPO_PUBLIC_API_URL); ({ value: process.env.EXPO_PUBLIC_API_URL } = input); for (process.env.EXPO_PUBLIC_API_URL in input) {} for (process.env.EXPO_PUBLIC_API_URL of input) {} } module.exports = [process.env.EXPO_PUBLIC_API_URL, process.env['EXPO_PUBLIC_OTHER'], process.env.EXPO_PUBLIC_API_URL = 'next', (() => { const process = { env: { EXPO_PUBLIC_API_URL: 'shadow' } }; return process.env.EXPO_PUBLIC_API_URL; })(), process.env.EXPO_ROUTER_IMPORT_MODE];`,
    options: options({
      dev: true,
      customTransformOptions: { engine: 'hermes', asyncRoutes: 'true' },
    }),
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('require("expo/virtual/env")');
  expect(result.result.metadata.publicEnvVars).toEqual([
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_OTHER',
  ]);
  expect(result.result.code).toContain('process.env.EXPO_PUBLIC_API_URL++');
  expect(result.result.code).toMatch(/process\.env\[['"]EXPO_PUBLIC_API_URL['"]\]\+\+/);
  expect(result.result.code).toMatch(/delete\s+\(?process\.env\.EXPO_PUBLIC_API_URL\)?/);
  expect(result.result.code).toMatch(/value:\s*process\.env\.EXPO_PUBLIC_API_URL/);
  expect(result.result.code).toContain('for (process.env.EXPO_PUBLIC_API_URL in input)');
  expect(result.result.code).toContain('for (process.env.EXPO_PUBLIC_API_URL of input)');
  const mappedPublicEnv = originalPositionFor(
    new TraceMap({
      version: 3,
      sources: [filename],
      ...result.result.map,
    } as any),
    generatedPositionOf(result.result.code, '.env.EXPO_PUBLIC_API_URL')
  );
  expect(mappedPublicEnv.line).toBe(1);
  const module = { exports: undefined as unknown };
  const processObject = { env: { EXPO_PUBLIC_API_URL: 'original' } };
  Function(
    'module',
    'require',
    'process',
    result.result.code
  )(
    module,
    (name: string) => {
      expect(name).toBe('expo/virtual/env');
      return {
        env: { EXPO_PUBLIC_API_URL: 'api', EXPO_PUBLIC_OTHER: 'other' },
      };
    },
    processObject
  );
  expect(module.exports).toEqual(['api', 'other', 'next', 'shadow', 'lazy']);
  expect(processObject.env.EXPO_PUBLIC_API_URL).toBe('next');

  const full = await transformFileFullyWithNoxcturnal({
    filename: workspaceFilename,
    projectRoot: '/app',
    source: `module.exports = process.env.EXPO_PUBLIC_API_URL;`,
    options: options({ dev: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(full.status).toBe('complete');
  if (full.status !== 'complete') return;
  expect(full.dependencies.map((dependency) => dependency.name)).toContain('expo/virtual/env');
});

it('preserves lazy Expo Router imports in production web bundles', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: workspaceFilename,
    projectRoot: '/app',
    source: `module.exports = process.env.EXPO_ROUTER_IMPORT_MODE;`,
    options: options({
      dev: false,
      platform: 'web',
      customTransformOptions: { engine: 'hermes', asyncRoutes: 'true' },
    }),
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('module.exports = "lazy"');
});

it('matches the non-Hermes dependency recipe without Babel', async () => {
  const source = `
const input = { kept: 2, extra: 3 };
const { kept, ...rest } = input;
async function run(value = 1) {
  class Box {
    field = value;
    read() { return { ...rest, kept, value: this.field }; }
  }
  return new Box().read();
}
module.exports = run;`;
  const native = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({
      unstable_transformProfile: 'default',
      customTransformOptions: { engine: undefined },
    }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
  });
  expect(native.status).toBe('complete');
  if (native.status !== 'complete') return;
  const babelResult = transformWithNonHermesBabelPreset(source, filename);
  const evaluate = async (code: string) => {
    const module = { exports: undefined as unknown };
    Function('module', 'exports', code)(module, module.exports);
    return (module.exports as (value?: number) => Promise<unknown>)();
  };
  await expect(evaluate(native.result.code)).resolves.toEqual(await evaluate(babelResult.code!));
  await expect(evaluate(native.result.code)).resolves.toEqual({
    extra: 3,
    kept: 2,
    value: 1,
  });
  expect(native.result.code).not.toContain('class Box');
  expect(native.result.code).not.toContain('async function run');
  expect(native.result.code).not.toContain('const input');

  const full = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({
      unstable_transformProfile: 'default',
      customTransformOptions: { engine: undefined },
    }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(full.status).toBe('complete');
});

it('falls back for ESM when Metro import support is disabled', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import value from 'pkg'; export default value;`,
    options: options({ experimentalImportSupport: false }),
    isDefaultExpoTransformer: true,
  });

  expect(result).toEqual({
    status: 'fallback',
    reason: 'expo-metro-eligibility:esm-requires-babel-module-transform',
  });
});

it.each([
  [
    'imports',
    `import v from 'foo'; import * as w from 'bar'; import { x } from 'baz'; import { y as z } from 'qux'; import 'side-effect'; v; w; x; z;`,
  ],
  [
    'deduplicated imports',
    `import a, * as b from 'second'; import c, { d as e, f } from 'third'; import { g, h } from 'third'; a; b; c; e; f; g; h;`,
  ],
  ['hoisting', `foo(); import { foo } from 'bar';`],
  ['default re-export', `export { default as foo } from 'bar';`],
  ['named re-exports', `export { foo as default, baz } from 'bar';`],
  [
    'local exports',
    `export const foo = 'foo'; export function fn() {} export class Box {} export { foo as renamed };`,
  ],
  ['destructured exports', `export const { foo, bar: [baz] } = value;`],
  ['default declarations', `export default class {};`],
  ['export all', `export * from 'bar';`],
  ['namespace re-export', `export * as namespace from 'bar';`],
  ['locally exported namespace import', `import * as namespace from 'bar'; export { namespace };`],
  [
    'default import specifier',
    `import { Platform, default as ReactNative } from 'react-native'; Platform; ReactNative;`,
  ],
  [
    'calls and constructors',
    `import value, { call, Constructor } from 'pkg'; call(); new Constructor(); new value.Member();`,
  ],
  ['forward local export', `export { value }; import { value } from 'pkg';`],
  ['unused development import', `import unused from 'pkg'; run();`],
  [
    'deferred export ordering',
    `export const local = 1; export default local; export { value } from 'pkg';`,
  ],
  ['mixed CommonJS exports', `export const value = 1; exports.other = 2; module.exports.x = 3;`],
  ['empty source export', `export {} from 'pkg'; run();`],
  ['duplicate export all', `export * from 'pkg'; export * from 'pkg';`],
  ['anonymous default function', `export default function () {}`],
  ['anonymous default function without keyword whitespace', `export default function() {}`],
  [
    'anonymous default async function without keyword whitespace',
    `export default async function() {}`,
  ],
  [
    'anonymous default generator function without keyword whitespace',
    `export default function*() {}`,
  ],
  ['anonymous default class', `export default class {}`],
  ['anonymous default derived class', `export default class extends Base {}`],
  [
    'd3 pointRadial named default function',
    `export default function (x, y) { return [(y = +y) * Math.cos((x -= Math.PI / 2)), y * Math.sin(x)]; }`,
  ],
  ['computed imported name', `import { "x-y" as value } from 'pkg'; value;`],
  ['renamed pseudo globals', `const exports = 1; export { exports as value };`],
])('matches importExportLiveBindings syntax for %s', async (_name, source) => {
  const native = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  if (native.status === 'fallback') throw new Error(native.reason);

  const expected = babel.transformSync(source, {
    ast: false,
    babelrc: false,
    comments: false,
    compact: false,
    configFile: false,
    filename,
    plugins: [[importExportLiveBindingsPlugin, { performConstantFolding: false, resolve: false }]],
  });
  if (!expected?.code) throw new Error('Babel live-bindings transform produced no output');

  expect(canonicalModuleBody(native.result.code, true)).toBe(canonicalModuleBody(expected.code));
});

it.each([
  ['unused import', `import unused from 'pkg'; run();`],
  ['used import', `import value from 'pkg'; run(value);`],
  ['binding collision', `const _pkg = 1; import { value } from 'pkg'; run(_pkg, value);`],
  ['directive prologue', `"use strict"; import { value } from 'pkg'; run(value);`],
  ['duplicate export all', `export * from 'pkg'; export * from 'pkg';`],
])('matches folded importExportLiveBindings syntax for %s', async (_name, source) => {
  const native = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ dev: false, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  if (native.status === 'fallback') throw new Error(native.reason);
  const expected = babel.transformSync(source, {
    babelrc: false,
    comments: false,
    configFile: false,
    filename,
    plugins: [[importExportLiveBindingsPlugin, { performConstantFolding: true, resolve: false }]],
  });
  if (!expected?.code) throw new Error('Babel live-bindings transform produced no output');
  expect(canonicalModuleBody(native.result.code, true)).toBe(canonicalModuleBody(expected.code));
});

it('uses static export values when live bindings are disabled', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import { value } from './source';
      export function read() { return value; }
      export { other } from './other';`,
    options: options({
      dev: false,
      experimentalImportSupport: true,
      customTransformOptions: { liveBindings: 'false' },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toMatch(/var value = .*\.value/);
  expect(result.result.code).toContain('exports.read = read');
  expect(result.result.code).toMatch(/exports\.other = .*\.other/);
  expect(result.result.code).not.toContain('Object.defineProperty(exports, "read"');
});

it('lowers static ESM imports and exports through the full native path', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import value from 'pkg'; export default value;`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(`var _pkg = _$$_REQUIRE(_dependencyMap[0], "pkg");`);
  expect(result.result.code).toContain(`var value = _interopDefault(_pkg);`);
  expect(result.result.code).toContain(`return _default;`);
  expect(result.dependencies).toMatchObject([
    { name: 'pkg', data: { isESMImport: true, asyncType: null } },
  ]);
});

it.each([
  ['class declaration', 'export default class Value {}', 'Value'],
  ['function declaration', 'export default function value() {}', 'value'],
  ['expression', 'export default { value: 1 }', '_default'],
])(
  'separates an EOF default-export %s from generated export assignments',
  async (_name, source, binding) => {
    const result = await transformFileFullyWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source,
      options: options({ dev: true, experimentalImportSupport: true }),
      isDefaultExpoTransformer: true,
      config: fullConfig(),
    });
    if (result.status === 'fallback') throw new Error(result.reason);
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.result.code).toContain(`return ${binding};`);
    expect(() => babel.parseSync(result.result.code)).not.toThrow();
  }
);

it.each([
  ['class', `export default class DOMException {}; DOMException.code = 1;`],
  ['function', `export default function createValue() {}; createValue.code = 1;`],
])('preserves a named default %s declaration binding', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;

  let factory: Function | undefined;
  new Function('__d', result.result.code)((value: Function) => {
    factory = value;
  });
  const moduleExports: { default?: { code?: number } } = {};
  factory?.(
    globalThis,
    () => undefined,
    () => undefined,
    () => undefined,
    { exports: moduleExports },
    moduleExports,
    []
  );
  expect(moduleExports.default?.code).toBe(1);
});

it.each([
  ['function', `export default function(value) { return value; }`],
  ['class', `export default class { constructor(value) { this.value = value; } }`],
])('preserves anonymous default %s identity and behavior', async (kind, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  if (result.status === 'fallback') throw new Error(result.reason);

  let factory: Function | undefined;
  new Function('__d', result.result.code)((value: Function) => {
    factory = value;
  });
  const moduleExports: { default?: Function } = {};
  factory?.(
    globalThis,
    () => undefined,
    () => undefined,
    () => undefined,
    { exports: moduleExports },
    moduleExports,
    []
  );
  const exported = moduleExports.default;
  expect(typeof exported).toBe('function');
  if (kind === 'function') expect(exported?.('value')).toBe('value');
  else
    expect(new (exported as new (value: string) => { value: string })('value').value).toBe('value');
});

it('writes ESM exports through the normalized Metro exports parameter', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `export const ctx = require.context('./routes');`,
    options: options({ dev: false, minify: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: { ...fullConfig(), unstable_allowRequireContext: true },
  });
  if (result.status === 'fallback') throw new Error(result.reason);

  let factory: Function | undefined;
  new Function('__d', result.result.code)((value: Function) => {
    factory = value;
  });
  const context = Object.assign(() => undefined, { keys: () => ['./route.tsx'] });
  const moduleExports: { ctx?: typeof context } = {};
  factory?.(
    globalThis,
    () => context,
    () => undefined,
    () => undefined,
    {},
    moduleExports,
    []
  );

  expect(moduleExports.ctx).toBe(context);
  expect(moduleExports.ctx?.keys()).toEqual(['./route.tsx']);
});

it('collects graph-optimization metadata without rewriting or wrapping modules', async () => {
  const source = `import 'side-effect';
import primary, { alpha as local } from 'pkg';
import { alpha as duplicateLocal } from 'pkg';
import * as namespace from 'all';
export { beta as renamed } from 'reexport';
export { gamma as another } from 'reexport';
export * from 'star';
const cjs = require('cjs');
export const output = [primary, local, duplicateLocal, namespace, cjs];`;
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options({
      dev: false,
      customTransformOptions: { engine: 'hermes', optimize: true },
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toContain('__d(function');
  expect(result.result.map.mappings.length).toBeGreaterThan(0);
  expect(result.result.code).toMatch(/from ["']pkg["']/);
  expect(result.result.code).toMatch(/require\(["']cjs["']\)/);
  expect(result.result.code).toMatch(/export (?:const|var) output/);
  expect(
    result.dependencies.map(({ name, data }) => [name, data.isESMImport, data.exportNames])
  ).toEqual([
    ['side-effect', true, []],
    ['pkg', true, ['default', 'alpha']],
    ['all', true, ['*']],
    ['reexport', true, ['beta', 'gamma']],
    ['star', true, ['*']],
    ['cjs', false, ['*']],
  ]);
  for (const dependency of result.dependencies) {
    expect(Object.isFrozen(dependency)).toBe(true);
    expect(Object.isFrozen(dependency.data)).toBe(true);
    expect(Object.keys(dependency)).not.toContain('exportNameSet');
  }
  expect(JSON.stringify(result.result.metadata)).not.toContain('exportNameSet');
});

it('selects ESM lowering from parsed syntax after comments and a shebang', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `#!/usr/bin/env node\n/* retained lead */\nimport value from "one";\nexport default value;`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.dependencies.map(({ name }) => name)).toEqual(['one']);
  expect(result.result.code).toContain(`Object.defineProperty(exports, "default"`);
  expect(result.result.code).not.toContain('import value');
});

it('preserves live imported references, direct-call semantics, and live local exports', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import * as ns from 'pkg'; import { value, call } from 'pkg'; export let local = value; export { local as renamed }; module.exports = { value, call: call(), ns }; local++;`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('var _pkg = _$$_REQUIRE(_dependencyMap[0], "pkg")');
  expect(result.result.code).not.toContain('var _pkg2 =');
  expect(result.result.code).toContain('var ns = _interopNamespace(_pkg)');
  expect(result.result.code).toContain('var local = _pkg.value');
  expect(result.result.code).toContain('value: _pkg.value');
  expect(result.result.code).toContain('call: (0, _pkg.call)()');
  expect(result.result.code).toContain('get: function () { return local; }');
  expect(result.dependencies).toHaveLength(1);
});

it('preserves live imported bindings that are exported locally', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import { URL, URLSearchParams as Params } from 'whatwg-url-minimum'; export { URL, Params as URLSearchParams };`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('return _whatwgUrlMinimum.URL;');
  expect(result.result.code).toContain('return _whatwgUrlMinimum.URLSearchParams;');
  expect(result.result.code).not.toContain('return URL;');
  expect(result.result.code).not.toContain('return Params;');
});

it('keeps ordinary named imports from helper directories as named imports', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import { usePrevious } from './helpers/usePrevious'; module.exports = usePrevious(1);`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(`(0, _helpersUsePrevious.usePrevious)(1)`);
  expect(result.result.code).not.toContain(
    `_$$_IMPORT_DEFAULT(_dependencyMap[0], "./helpers/usePrevious")`
  );
});

it('preserves constructor semantics for a default import', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import EventEmitter from 'events'; export default new EventEmitter();`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(`var EventEmitter = _interopDefault(_events);`);
  expect(result.result.code).toContain(`new EventEmitter.default()`);
});

it('preserves constructor semantics for a member of a default import', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import Animated from './Animated'; export default new Animated.Value(1);`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain(`var Animated = _interopDefault(_Animated);`);
  expect(result.result.code).toContain(`new Animated.default.Value(1)`);
});

it("loads Babel runtime helpers through Metro's default-import ABI", async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `import Base from './Base'; class Derived extends Base {} module.exports = new Derived();`,
    options: options({
      dev: true,
      experimentalImportSupport: true,
      unstable_transformProfile: 'default',
    }),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('var Base = _interopDefault(_Base)');
  expect(result.result.code).toMatch(
    /construct: _\$\$_IMPORT_DEFAULT\(_dependencyMap\[\d+\], "@babel\/runtime\/helpers\/construct"\)/
  );
});

it('lowers named, namespace, and export-all re-exports with live getters', async () => {
  const result = await transformFileFullyWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `export { value as renamed } from 'pkg'; export * as namespace from 'other'; export * from 'all';`,
    options: options({ dev: true, experimentalImportSupport: true }),
    isDefaultExpoTransformer: true,
    config: {
      allowOptionalDependencies: false,
      asyncRequireModulePath: 'metro-runtime',
      globalPrefix: '',
      unstable_compactOutput: false,
    },
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('return _pkg.value;');
  expect(result.result.code).toContain('return _other2;');
  expect(result.result.code).toContain("if (k !== 'default'");
  expect(result.dependencies.map(({ name }) => name)).toEqual(['pkg', 'other', 'all']);
});

it.each([
  ['custom transformer', filename, 'const value = 1;', false, 'custom-babel-transformer'],
  [
    'React Native Codegen',
    filename,
    'codegenNativeComponent("View")',
    true,
    'react-native-codegen',
  ],
])('falls back for %s', async (_name, candidate, source, isDefaultExpoTransformer, reason) => {
  await expect(
    transformNodeModuleWithNoxcturnal({
      filename: candidate,
      projectRoot: '/app',
      source,
      options: options(),
      isDefaultExpoTransformer,
    })
  ).resolves.toEqual({ status: 'fallback', reason });
});

it.each([
  ['Metro null-prefixed polyfill', '\0polyfill:environment-variables'],
  ['Expo Router require context', '/app/router-e2e?ctx=1122149ada429c11a789cd9dfdcaefb64b6dd8f5'],
])('completes extensionless %s through the full native Metro path', async (_name, candidate) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/app',
    source: 'module.exports = process.env.NODE_ENV;',
    options: options(),
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });
  expect(result).toEqual(expect.objectContaining({ status: 'complete' }));
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('__d(function');
  expect(result.dependencies).toEqual([]);
});

it.each([
  ['Expo virtual', '/repo/packages/expo/virtual/streams.js'],
  ['Metro null-prefixed', '\0polyfill:environment-variables'],
])('uses the native source stage for %s script polyfills', async (_name, candidate) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: candidate,
    projectRoot: '/repo/apps/example',
    source: "globalThis.ReadableStream ||= require('stream/web').ReadableStream;",
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('globalThis.ReadableStream');
});

it.each([
  ['Expo virtual', '/repo/packages/expo/virtual/streams.js'],
  ['Metro null-prefixed', '\0polyfill:environment-variables'],
])('completes %s through the full native script path', async (_name, candidate) => {
  const source = `"use strict";
global.__scriptModeValue = (global.__scriptModeValue ?? 0) + 1;`;
  const result = await transformFileFullyWithNoxcturnal({
    filename: candidate,
    projectRoot: '/repo/apps/example',
    source,
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result).toEqual(expect.objectContaining({ status: 'complete' }));
  if (result.status !== 'complete') return;
  expect(result.dependencies).toEqual([]);
  expect(result.dependencyMapName).toBe('');
  expect(result.result.code).toContain('(function (global) {');
  expect(result.result.code).toContain(
    "typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this"
  );
  expect(result.result.code).not.toContain('__d(function');

  const runtimeGlobal: { __scriptModeValue?: number } = {};
  new Function('globalThis', result.result.code)(runtimeGlobal);
  expect(runtimeGlobal.__scriptModeValue).toBe(1);
});

it.each([
  ['empty input', ''],
  ['single-line input', 'global.value = 1;'],
  ['trailing-newline input', 'global.value = 1;\n'],
  ['multiline input', 'global.first = 1;\nglobal.second = 2;'],
] as const)('wraps %s without changing the script body', async (_name, source) => {
  const result = await transformFileFullyWithNoxcturnal({
    filename: '\0polyfill:test',
    projectRoot: '/app',
    source,
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const prefix = '(function (global) {\n';
  const suffix =
    "})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);";
  expect(result.result.code).toBe(
    `${prefix}${source}${source.endsWith('\n') ? '' : '\n'}${suffix}`
  );
  expect(result.dependencies).toEqual([]);
});

it('keeps native script mappings at column zero and the generated wrapper sourceless', async () => {
  const source = 'global.first = 1;\nglobal.second = 2;';
  const result = await transformFileFullyWithNoxcturnal({
    filename: '\0polyfill:test',
    projectRoot: '/app',
    source,
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
    config: fullConfig(),
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const trace = new TraceMap({
    version: 3,
    sources: ['\0polyfill:test'],
    ...result.result.map,
  } as any);
  expect(originalPositionFor(trace, { line: 2, column: 0 })).toMatchObject({
    line: 1,
    column: 0,
  });
  expect(originalPositionFor(trace, { line: 3, column: 0 })).toMatchObject({
    line: 2,
    column: 0,
  });
  expect(originalPositionFor(trace, { line: 1, column: 0 }).line).toBeNull();
  expect(originalPositionFor(trace, { line: 4, column: 0 }).line).toBeNull();
});

it('preserves native script function maps and compact output behavior', async () => {
  const source = 'function scriptFunction() { return 1; }\nglobal.value = scriptFunction();';
  const input = {
    filename: '\0polyfill:test',
    projectRoot: '/app',
    source,
    options: options({ type: 'script' }),
    enableBabelRuntime: false,
    isDefaultExpoTransformer: true,
  };
  const regular = await transformFileFullyWithNoxcturnal({
    ...input,
    config: fullConfig(),
  });
  const compact = await transformFileFullyWithNoxcturnal({
    ...input,
    config: { ...fullConfig(), unstable_compactOutput: true },
  });

  expect(regular.status).toBe('complete');
  expect(compact.status).toBe('complete');
  if (regular.status !== 'complete' || compact.status !== 'complete') return;
  expect(regular.result.functionMap?.names).toEqual(
    expect.arrayContaining(['<global>', 'scriptFunction'])
  );
  expect(compact.result.code).not.toContain('\n');
  const runtimeGlobal: { value?: number } = {};
  new Function('globalThis', compact.result.code)(runtimeGlobal);
  expect(runtimeGlobal.value).toBe(1);
});
