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

it('lowers JSX in a .js file through the consumer-owned JSX capability', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'module.exports = <View />;',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toContain('<View');
  expect(result.result.code).toContain('react/jsx-runtime');
});

it.each([
  [
    '/app/node_modules/example/index.ts',
    'const value: number = process.env.EXPO_OS; module.exports = value;',
  ],
  [
    '/app/node_modules/example/index.tsx',
    'const view: React.Node = <View title={process.env.EXPO_OS} />; module.exports = view;',
  ],
])('strips typed syntax for %s', async (typedFilename, source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: typedFilename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toMatch(/:\s*(?:number|React\.Node)|<View/);
  expect(result.result.code).toContain('"ios"');
});

it("keeps Babel's .ts JSX rejection instead of widening TypeScript syntax", async () => {
  const typedFilename = '/app/node_modules/example/index.ts';
  const source = 'module.exports = <View />;';
  expect(() => transformWithBabelPreset(source, typedFilename)).toThrow();

  const native = await transformNodeModuleWithNoxcturnal({
    filename: typedFilename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  expect(native.status).toBe('fallback');
  if (native.status !== 'fallback') return;
  expect(native.reason).toContain('parse-error');
});

it('matches Babel preset Expo runtime behavior and source positions for TypeScript', async () => {
  const typedFilename = '/app/node_modules/example/differential.ts';
  const source = `enum Direction { Up, Down = 4 }
class Box {
  constructor(public value: number) {}
}
module.exports = [Direction.Up, Direction.Down, new Box(3).value];`;
  const native = await transformNodeModuleWithNoxcturnal({
    filename: typedFilename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (native.status === 'fallback') throw new Error(native.reason);
  const babelResult = transformWithBabelPreset(source, typedFilename);

  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function('module', 'exports', code)(module, module.exports);
    return module.exports;
  };
  expect(evaluate(native.result.code)).toEqual(evaluate(babelResult.code!));
  expect(evaluate(native.result.code)).toEqual([0, 4, 3]);

  const nativeOriginal = originalPositionFor(
    new TraceMap({
      version: 3,
      sources: [typedFilename],
      ...native.result.map,
    } as any),
    generatedPositionOf(native.result.code, 'module.exports')
  );
  const babelOriginal = originalPositionFor(
    new TraceMap(babelResult.map! as any),
    generatedPositionOf(babelResult.code!, 'module.exports')
  );
  expect(nativeOriginal.line).toBe(5);
  expect(babelOriginal.line).toBe(5);
});

it('matches Babel preset Expo runtime behavior for TypeScript namespaces', async () => {
  const typedFilename = '/app/node_modules/example/namespace.ts';
  const source =
    'namespace Values { export const answer: number = 4 } module.exports = Values.answer;';
  const native = await transformNodeModuleWithNoxcturnal({
    filename: typedFilename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (native.status === 'fallback') throw new Error(native.reason);
  const babelResult = transformWithBabelPreset(source, typedFilename);
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function('module', 'exports', code)(module, module.exports);
    return module.exports;
  };
  expect(evaluate(native.result.code)).toBe(evaluate(babelResult.code!));
  expect(evaluate(native.result.code)).toBe(4);
});

it("matches Babel preset Expo's surviving TypeScript dependency edges", async () => {
  const typedFilename = '/app/node_modules/example/dependencies.tsx';
  const source = `import type { Removed } from "types-only";
import { type AlsoRemoved, kept } from "runtime-edge";
const value: Removed | AlsoRemoved = kept;
module.exports = <View value={value} />;`;
  const native = await transformFileFullyWithNoxcturnal({
    filename: typedFilename,
    projectRoot: '/app',
    source,
    options: options({ dev: true }),
    config: fullConfig(),
    isDefaultExpoTransformer: true,
  });
  if (native.status === 'fallback') throw new Error(native.reason);
  const babelResult = transformWithBabelPreset(source, typedFilename, true);

  const babelEdges = staticModuleSpecifiers(babelResult.code!).sort();
  const nativeEdges = native.dependencies.map((dependency) => dependency.name).sort();
  expect(nativeEdges).toEqual(babelEdges);
  expect(nativeEdges).toEqual(['react/jsx-runtime', 'runtime-edge']);
  expect(native.result.code).not.toContain('types-only');
  expect(native.result.code).not.toContain('AlsoRemoved');
});

it.each(
  (['classic', 'automatic'] as const).flatMap((runtime) =>
    [false, true].flatMap((dev) =>
      ['js', 'jsx', 'tsx'].map((extension) => ({
        runtime,
        dev,
        extension,
      }))
    )
  )
)('matches Babel JSX behavior for $runtime dev=$dev .$extension', ({ runtime, dev, extension }) => {
  const filename = `/app/node_modules/example/component.${extension}`;
  const typedPrefix = extension === 'tsx' ? 'const typed: number = 2;' : 'const typed = 2;';
  const source = `${typedPrefix}
const props = { label: "ok" };
module.exports = <section {...props}>{typed}</section>;`;
  const jsxMode = `${runtime}${dev ? '-development' : ''}` as
    | 'classic'
    | 'classic-development'
    | 'automatic'
    | 'automatic-development';
  const nativeCode = transformWithNativePlan(source, filename, {
    ...(extension === 'tsx' ? { typescript: 'strip' as const } : null),
    jsx: jsxMode,
  });
  const jsxPlugin = dev
    ? '@babel/plugin-transform-react-jsx-development'
    : '@babel/plugin-transform-react-jsx';
  const babelPlugins: [string, Record<string, unknown> | undefined][] = [];
  if (extension === 'tsx') {
    babelPlugins.push([
      '@babel/plugin-transform-typescript',
      { isTSX: true, allowExtensions: true },
    ]);
  }
  babelPlugins.push([jsxPlugin, { runtime }]);
  babelPlugins.push(['@babel/plugin-transform-modules-commonjs', undefined]);
  const babelCode = transformWithBabelPlugins(source, babelPlugins, filename);
  const nativeExecutable = transformWithBabelPlugins(
    nativeCode,
    [['@babel/plugin-transform-modules-commonjs', undefined]],
    filename
  );

  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({
      type,
      props,
    });
    const React = {
      createElement(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) {
        return {
          type,
          props: {
            ...props,
            ...(children.length === 0
              ? null
              : { children: children.length === 1 ? children[0] : children }),
          },
        };
      },
    };
    const runtimeModule = {
      jsx,
      jsxs: jsx,
      jsxDEV: jsx,
      Fragment: Symbol.for('Fragment'),
    };
    Function(
      'module',
      'exports',
      'require',
      'React',
      code
    )(
      module,
      module.exports,
      (specifier: string) => {
        if (/^react\/jsx(?:-dev)?-runtime$/.test(specifier)) return runtimeModule;
        throw new Error(`unexpected JSX dependency ${specifier}`);
      },
      React
    );
    const value = module.exports as {
      type: unknown;
      props: Record<string, unknown>;
    };
    const { __self: _self, __source: _source, ...props } = value.props;
    return { type: value.type, props };
  };

  expect(evaluate(nativeExecutable)).toEqual(evaluate(babelCode));
  expect(evaluate(nativeExecutable)).toEqual({
    type: 'section',
    props: { label: 'ok', children: 2 },
  });
  if (dev) {
    expect(nativeCode).toMatch(runtime === 'automatic' ? /jsxDEV/ : /__source/);
    expect(babelCode).toMatch(runtime === 'automatic' ? /jsxDEV/ : /__source/);
  }
});

it.each([
  {
    name: 'class static blocks',
    source: 'class Value { static { this.answer = 42 } } module.exports = Value.answer;',
    transforms: { classStaticBlock: true },
    plugin: '@babel/plugin-transform-class-static-block',
  },
  {
    name: 'logical assignment evaluation order',
    source:
      'let gets = 0, sets = 0; const value = { get item() { gets++; return 0 }, set item(next) { sets += next } }; value.item ||= 3; module.exports = [gets, sets];',
    transforms: { logicalAssignmentOperators: true },
    plugin: '@babel/plugin-transform-logical-assignment-operators',
  },
  {
    name: 'optional chaining evaluation order',
    source:
      'let calls = 0; const read = () => (++calls, { value: 7 }); module.exports = [read()?.value, calls];',
    transforms: { optionalChaining: { loose: false } },
    plugin: '@babel/plugin-transform-optional-chaining',
    pluginOptions: { loose: false },
  },
  {
    name: 'loose optional chaining evaluation order',
    source:
      'let calls = 0; const read = () => (++calls, { value: 7 }); module.exports = [read()?.value, calls];',
    transforms: { optionalChaining: { loose: true } },
    plugin: '@babel/plugin-transform-optional-chaining',
    pluginOptions: { loose: true },
  },
  {
    name: 'nullish coalescing evaluation order',
    source:
      'let calls = 0; const read = () => (++calls, null); module.exports = [read() ?? 7, calls];',
    transforms: { nullishCoalescingOperator: { loose: false } },
    plugin: '@babel/plugin-transform-nullish-coalescing-operator',
    pluginOptions: { loose: false },
  },
  {
    name: 'loose nullish coalescing evaluation order',
    source:
      'let calls = 0; const read = () => (++calls, null); module.exports = [read() ?? 7, calls];',
    transforms: { nullishCoalescingOperator: { loose: true } },
    plugin: '@babel/plugin-transform-nullish-coalescing-operator',
    pluginOptions: { loose: true },
  },
  {
    name: 'optional catch binding',
    source: 'let caught = false; try { throw 1 } catch { caught = true } module.exports = caught;',
    transforms: { optionalCatchBinding: true },
    plugin: '@babel/plugin-transform-optional-catch-binding',
  },
  {
    name: 'exponentiation assignment evaluation order',
    source:
      "let calls = 0; const key = () => (++calls, 'value'); const object = { value: 3 }; object[key()] **= 2; module.exports = [object.value, calls];",
    transforms: { exponentiationOperator: true },
    plugin: '@babel/plugin-transform-exponentiation-operator',
  },
  {
    name: 'sticky regexp construction',
    source: 'module.exports = /a/y;',
    transforms: { regexpSticky: true },
    plugin: '@babel/plugin-transform-sticky-regex',
  },
  {
    name: 'dotAll regexp matching',
    source: "const expression = /a.b/s; module.exports = expression.test('a\\nb');",
    transforms: { regexpDotAll: true },
    plugin: '@babel/plugin-transform-dotall-regex',
  },
  {
    name: 'Unicode regexp astral literals code points and dot',
    source:
      "module.exports = [/😀+/u.test('😀😀'), /\\u{1F600}/u.test('😀'), /^.$/u.test('😀'), /^.$/u.test('\\n')];",
    transforms: { regexpUnicode: true },
    plugin: '@babel/plugin-transform-unicode-regex',
  },
  {
    name: 'Unicode property regexp ASCII scripts letters and complements',
    source:
      "module.exports = [/\\p{ASCII}/u.test('A'), /\\p{Script=Greek}/u.test('λ'), /\\p{Letter}/u.test('𐐀'), /\\P{ASCII}/u.test('λ')];",
    transforms: {
      regexpUnicode: true,
      regexpUnicodePropertyEscapes: true,
    },
    plugin: '@babel/plugin-transform-unicode-property-regex',
  },
  {
    name: 'named capture groups exec replacement and backreferences',
    source:
      "const expression = /(?<word>a).\\k<word>/s; const match = expression.exec('a\\na'); module.exports = [match[0], match.groups.word, 'a\\na'.replace(expression, '$<word>!'), /😀+/u.test('😀😀'), /^.$/u.test('😀'), /\\p{Script=Greek}/u.test('λ')];",
    transforms: {
      regexpDotAll: true,
      regexpNamedCaptureGroups: true,
    },
    plugin: '@babel/plugin-transform-named-capturing-groups-regex',
  },
  {
    name: 'parameters defaults rest lexical state and body scope',
    source:
      'var fallback = 7; function make(input) { return (first = fallback, ...rest) => { var fallback = 2; return [first, rest, this.value, arguments[0]]; }; } const read = make.call({ value: 3 }, 4); module.exports = [read(undefined, 5), read.length];',
    transforms: { parameters: true },
    plugin: '@babel/plugin-transform-parameters',
  },
  {
    name: 'destructuring iterators computed keys defaults rest assignment and catch',
    source:
      "let closed = false, reads = 0; const key = 'value'; const input = { get value() { reads++; return { nested: 3 } }, extra: 4 }; const { [key]: { nested = 2 }, ...rest } = input; function* values() { try { yield 5; yield 6; yield 7 } finally { closed = true } } let first, tail; const result = ([first, ...tail] = values()); let caught; try { throw { message: 'ok' } } catch ({ message }) { caught = message } module.exports = [nested, rest.extra, first, tail, result === result, reads, closed, caught];",
    transforms: { destructuring: true },
    plugin: '@babel/plugin-transform-destructuring',
    pluginOptions: { useBuiltIns: true },
  },
  {
    name: 'for-of iterator closing nested loops and labeled continue',
    source:
      'let closed = 0, output = []; function* values() { try { yield 1; yield 2 } finally { closed++ } } outer: for (const value of values()) { for (const nested of [value]) { if (nested === 1) continue outer; output.push(nested); break outer; } } module.exports = [output, closed];',
    transforms: { forOf: true },
    plugin: '@babel/plugin-transform-for-of',
  },
  {
    name: 'classes methods accessors computed keys expressions and default inheritance',
    source:
      "const key = 'double'; class Base { constructor(value) { this.value = value } get current() { return this.value } set current(value) { this.value = value } [key]() { return this.value * 2 } static create(value) { return new this(value) } } class Derived extends Base {} const Expression = class Named { method() { return Named.name } }; const value = Derived.create(3); value.current = 4; module.exports = [value.current, value.double(), value instanceof Base, Expression.name, new Expression().method()];",
    transforms: { classes: true },
    plugin: '@babel/plugin-transform-classes',
  },
  {
    // Noxcturnal selects a fixed private-state representation. Babel's loose
    // mode is used here only as an independent semantic comparison.
    name: 'private methods fields calls and access',
    source:
      'class Secret { #value = 2; #double(input) { return this.#value * input } read() { return this.#double(3) } } module.exports = new Secret().read();',
    transforms: {
      privateMethods: true,
    },
    plugin: '@babel/plugin-transform-private-methods',
    pluginOptions: { loose: true },
  },
  {
    name: 'private-in brand checks',
    source:
      'class Secret { #value = 2; has(input) { return #value in input } } const value = new Secret(); module.exports = [value.has(value), value.has({})];',
    transforms: {
      privatePropertyInObject: true,
    },
    plugin: '@babel/plugin-transform-private-property-in-object',
    pluginOptions: { loose: true },
  },
] satisfies {
  name: string;
  source: string;
  transforms: PreflightTransforms;
  plugin: string;
  pluginOptions?: Record<string, unknown>;
}[])(
  "matches Babel's independent $name behavior",
  ({ source, transforms, plugin, pluginOptions }) => {
    const evaluate = (code: string) => {
      const module = { exports: undefined as unknown };
      Function(
        'module',
        'exports',
        'require',
        code
      )(module, module.exports, requireFromBabelPresetExpo);
      return module.exports;
    };
    const nativeCode = transformWithNativeToggle(source, transforms);
    const babelCode = transformWithBabelPlugin(source, plugin, pluginOptions);

    expect(evaluate(nativeCode)).toEqual(evaluate(babelCode));
  }
);

it.each([false, true])('matches Babel class-properties behavior with loose=%s', (loose) => {
  const source =
    'let calls = 0; class Base { set field(value) { calls += value } } class Derived extends Base { field = 2 } const value = new Derived(); module.exports = [calls, value.field];';
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, module.exports, requireFromBabelPresetExpo);
    return module.exports;
  };
  const nativeCode = transformWithNativeToggle(source, {
    classProperties: { loose },
  });
  const babelCode = transformWithBabelPlugin(source, '@babel/plugin-transform-class-properties', {
    loose,
  });

  expect(evaluate(nativeCode)).toEqual(evaluate(babelCode));
});

it('matches Babel spec object-rest/spread symbols and getter order', () => {
  const source = `const key = Symbol("key");
let gets = 0;
const source = { a: 1, get b() { gets++; return 2; }, [key]: 3 };
const copy = { ...source };
const { a, ...rest } = copy;
module.exports = [copy.b, gets, rest[key], a];`;
  const nativeCode = transformWithNativeToggle(source, {
    objectRestSpread: { loose: false, useBuiltIns: false },
  });
  const babelCode = transformWithBabelPlugin(source, '@babel/plugin-transform-object-rest-spread', {
    loose: false,
    useBuiltIns: false,
  });
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, module.exports, requireFromBabelPresetExpo);
    return module.exports;
  };

  expect(evaluate(nativeCode)).toEqual(evaluate(babelCode));
  expect(evaluate(nativeCode)).toEqual([2, 1, 3, 1]);
});

it('matches Babel export-namespace-from module behavior', () => {
  const source = 'export * as values from "pkg";';
  const nativeCode = transformWithNativeToggle(source, {
    exportNamespaceFrom: true,
  });
  const nativeExecutable = transformWithBabelPlugins(nativeCode, [
    ['@babel/plugin-transform-modules-commonjs', undefined],
  ]);
  const babelCode = transformWithBabelPlugins(source, [
    ['@babel/plugin-transform-export-namespace-from', undefined],
    ['@babel/plugin-transform-modules-commonjs', undefined],
  ]);
  const evaluate = (code: string) => {
    const exports: Record<string, unknown> = {};
    const module = { exports };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, exports, (specifier: string) => {
      if (specifier === 'pkg') return { answer: 42 };
      throw new Error(`unexpected namespace dependency ${specifier}`);
    });
    return module.exports;
  };

  expect(evaluate(nativeExecutable)).toEqual(evaluate(babelCode));
  expect(evaluate(nativeExecutable)).toMatchObject({
    values: { answer: 42 },
  });
});

it('matches Babel async-to-generator runtime behavior', async () => {
  const source =
    'module.exports = async function read(value) { const first = await Promise.resolve(value); return first + await 2; };';
  const nativeCode = transformWithNativeToggle(source, {
    asyncFunctions: true,
  });
  const babelCode = transformWithBabelPlugin(source, '@babel/plugin-transform-async-to-generator');
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, module.exports, requireFromBabelPresetExpo);
    return module.exports as (value: number) => Promise<number>;
  };

  expect(await evaluate(nativeCode)(4)).toBe(await evaluate(babelCode)(4));
});

it('matches Babel async-generator delegation and for-await behavior', async () => {
  const source = `module.exports = async function* values(input) {
  yield await 1;
  yield* input;
  for await (const value of input) yield value + 1;
};`;
  const nativeCode = transformWithNativeToggle(source, {
    asyncGeneratorFunctions: true,
  });
  const babelCode = transformWithBabelPlugin(
    source,
    '@babel/plugin-transform-async-generator-functions'
  );
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, module.exports, requireFromBabelPresetExpo);
    return module.exports as (input: number[]) => AsyncIterable<number>;
  };
  const collect = async (iterable: AsyncIterable<number>) => {
    const values: number[] = [];
    for await (const value of iterable) values.push(value);
    return values;
  };

  expect(await collect(evaluate(nativeCode)([2, 3]))).toEqual(
    await collect(evaluate(babelCode)([2, 3]))
  );
});

it.each([
  {
    name: 'reverse disposal order',
    source: `const events = [];
const first = { [Symbol.dispose || Symbol.for("Symbol.dispose")]() { events.push("first"); } };
const second = { [Symbol.dispose || Symbol.for("Symbol.dispose")]() { events.push("second"); } };
{
  using a = first;
  using b = second;
  events.push("body");
}
module.exports = events;`,
  },
  {
    name: 'suppressed disposal errors',
    source: `module.exports = function run() {
  try {
    using value = { [Symbol.dispose || Symbol.for("Symbol.dispose")]() { throw new Error("dispose"); } };
    throw new Error("body");
  } catch (error) {
    return [error.name, error.error.message, error.suppressed.message];
  }
};`,
  },
  {
    name: 'async disposal',
    source: `module.exports = async function run() {
  const events = [];
  await using value = {
    [Symbol.asyncDispose || Symbol.for("Symbol.asyncDispose")]() {
      return Promise.resolve().then(() => events.push("dispose"));
    }
  };
  events.push("body");
  return events;
};`,
  },
])('matches Babel explicit-resource-management $name', async ({ source }) => {
  const nativeCode = transformWithNativeToggle(source, {
    explicitResourceManagement: true,
  });
  const babelCode = transformWithBabelPlugin(
    source,
    '@babel/plugin-transform-explicit-resource-management'
  );
  const evaluate = (code: string) => {
    const module = { exports: undefined as unknown };
    Function(
      'module',
      'exports',
      'require',
      code
    )(module, module.exports, requireFromBabelPresetExpo);
    return typeof module.exports === 'function'
      ? (module.exports as () => unknown)()
      : module.exports;
  };

  expect(await evaluate(nativeCode)).toEqual(await evaluate(babelCode));
});

it.each([
  ['compiled', '', true],
  ['default opt-out', '"use no memo";', false],
  ['Expo widget opt-out', '"widget";', false],
])(
  "matches Babel preset Expo's React Compiler boundary for %s",
  (_name, directive, shouldCompile) => {
    const candidate = '/app/Component.tsx';
    const source = `type Props = { text: string };
function Component(props: Props) {
  ${directive}
  return <View>{props.text}</View>;
}`;
    const native = transformWithNoxcturnal(
      source,
      candidate,
      defineNativePipeline({
        phases: [
          {
            name: 'react-compiler',
            native: {
              reactCompiler: {
                compilationMode: 'infer',
                panicThreshold: 'none',
                target: '19',
                enableResetCacheOnSourceFileChanges: true,
                customOptOutDirectives: ['widget'],
              },
              typescript: 'strip',
              jsx: 'automatic',
            },
          },
        ],
      })
    );
    if (native.status !== 'complete') throw new Error(native.reason);
    const babelResult = transformWithReactCompilerPreset(source, candidate);

    for (const code of [native.code, babelResult.code!]) {
      expect(code.includes('react/compiler-runtime')).toBe(shouldCompile);
      expect(/\b_c\(/.test(code)).toBe(shouldCompile);
      expect(code).not.toContain('type Props');
      expect(code).not.toContain('<View');
      expect(code).toContain('react/jsx-runtime');
    }
  }
);

it("matches React Refresh's component registrations and hook signatures", () => {
  const source = `
    import { memo, useState } from "react";
    export const Wrapped = memo(function Inner() {
      const [value] = useState(0);
      return <View>{value}</View>;
    });
    export default function App() {
      return <Wrapped />;
    }
  `;
  const nativeCode = transformWithNativePlan(source, '/app/App.jsx', {
    jsx: 'automatic',
    jsxImportSource: 'react',
    reactRefresh: {},
  });
  const babelCode = transformWithBabelPlugins(
    source,
    [
      ['react-refresh/babel', { skipEnvCheck: true }],
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    ],
    '/app/App.jsx'
  );
  const registrations = (code: string) =>
    [...code.matchAll(/\$RefreshReg\$\([^,]+,\s*"([^"]+)"\)/g)].map((match) => match[1]).sort();
  const signatures = (code: string) => [...code.matchAll(/\$RefreshSig\$\(\)/g)].length;

  expect(registrations(nativeCode)).toEqual(registrations(babelCode));
  expect(registrations(nativeCode)).toEqual(['App', 'Wrapped', 'Wrapped$memo']);
  expect(signatures(nativeCode)).toBe(signatures(babelCode));
  expect(signatures(nativeCode)).toBe(1);
});

it.each([
  [false, 'react/jsx-runtime', /\b_?jsx\(/],
  [true, 'react/jsx-runtime', /\b_?jsx\(/],
])("matches Babel preset Expo's JSX runtime selection in dev=%s", async (dev, runtime, call) => {
  const jsxFilename = '/app/node_modules/example/differential.jsx';
  const source = 'module.exports = <View title="hello">text</View>;';
  const native = await transformNodeModuleWithNoxcturnal({
    filename: jsxFilename,
    projectRoot: '/app',
    source,
    options: options({ dev }),
    isDefaultExpoTransformer: true,
  });
  if (native.status === 'fallback') throw new Error(native.reason);
  const babelResult = transformWithBabelPreset(source, jsxFilename, dev);

  expect(native.result.code).toContain(runtime);
  expect(babelResult.code).toContain(runtime);
  expect(native.result.code).toMatch(call);
  expect(babelResult.code).toMatch(call);
  expect(native.result.code).not.toContain('<View');
  expect(babelResult.code).not.toContain('<View');
});

it.each(
  [false, true].flatMap((server) =>
    [false, true].flatMap((dev) =>
      ['js', 'jsx', 'tsx'].map((extension) => ({ server, dev, extension }))
    )
  )
)(
  'matches the real Expo preset language boundary for server=$server dev=$dev .$extension',
  ({ server, dev, extension }) => {
    const candidate = `/app/node_modules/example/preset-boundary.${extension}`;
    const source =
      extension === 'tsx'
        ? 'const value: number = 2; module.exports = <View value={value} />;'
        : 'const value = 2; module.exports = <View value={value} />;';
    const nativeCode = transformWithNativePlan(source, candidate, {
      ...(extension === 'tsx' ? { typescript: 'strip' as const } : null),
      // This is the consumer recipe selected by Metro for both dev and prod.
      jsx: 'automatic',
    });
    const babelResult = transformWithBabelPreset(source, candidate, dev, server);

    for (const code of [nativeCode, babelResult.code!]) {
      expect(code).toContain('react/jsx-runtime');
      expect(code).toMatch(/\b_?jsx\(/);
      expect(code).not.toContain('<View');
      expect(code).not.toMatch(/value\s*:\s*number/);
    }
  }
);

it('lowers class static blocks without selecting unrelated class transforms', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'class Value { field = 1; static { this.answer = 42 } } module.exports = Value;',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toContain('static {');
  expect(result.result.code).toContain('field = 1');
});

it('preserves per-iteration bindings captured by loop closures', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      'const callbacks = []; for (let value of [1, 2, 3]) callbacks.push(() => value); module.exports = callbacks.map(callback => callback());',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  expect(module.exports).toEqual([1, 2, 3]);
});

it.each([
  [
    'continue',
    'const callbacks=[]; for(let i=0;i<4;i++){ if(i===1) continue; callbacks.push(()=>i); } module.exports=callbacks.map(fn=>fn());',
    [0, 2, 3],
  ],
  [
    'break',
    'const callbacks=[]; for(let i=0;i<4;i++){ if(i===2) break; callbacks.push(()=>i); } module.exports=callbacks.map(fn=>fn());',
    [0, 1],
  ],
  [
    'return',
    'function run(){ const callbacks=[]; for(let i=0;i<4;i++){ callbacks.push(()=>i); if(i===2) return [i,callbacks.map(fn=>fn())]; } } module.exports=run();',
    [2, [0, 1, 2]],
  ],
  [
    'labeled continue',
    'const callbacks=[]; outer: for(let i=0;i<3;i++){ for(var j=0;j<2;j++){ if(j===1) continue outer; callbacks.push(()=>i); } } module.exports=callbacks.map(fn=>fn());',
    [0, 1, 2],
  ],
  [
    'captured mutation',
    'const callbacks=[]; for(let i=0;i<4;i++){ callbacks.push(()=>i); i+=1; } module.exports=callbacks.map(fn=>fn());',
    [1, 3],
  ],
  [
    'multiple captured bindings',
    'const callbacks=[]; for(let i=0,j=10;i<3;i++,j++){ callbacks.push(()=>i+j); } module.exports=callbacks.map(fn=>fn());',
    [10, 12, 14],
  ],
])('preserves captured-loop %s control flow', async (_name, source, expected) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  const babelModule = { exports: undefined as unknown };
  Function(
    'module',
    'exports',
    transformWithBabelPlugin(source, '@babel/plugin-transform-block-scoping')
  )(babelModule, babelModule.exports);
  expect(module.exports).toEqual(babelModule.exports);
  expect(module.exports).toEqual(expected);
  expect(result.result.map.mappings.length).toBeGreaterThan(0);
});

it.each([
  [
    'for body',
    'const callbacks=[]; for(var i=0;i<3;i++){ let value=i; callbacks.push(()=>value); } module.exports=callbacks.map(fn=>fn());',
  ],
  [
    'while body',
    'const callbacks=[]; var i=0; while(i<3){ let value=i++; callbacks.push(()=>value); } module.exports=callbacks.map(fn=>fn());',
  ],
  [
    'do-while body',
    'const callbacks=[]; var i=0; do { let value=i++; callbacks.push(()=>value); } while(i<3); module.exports=callbacks.map(fn=>fn());',
  ],
])('preserves per-iteration bindings declared in a %s', async (_name, source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  const babelModule = { exports: undefined as unknown };
  Function(
    'module',
    'exports',
    transformWithBabelPlugin(source, '@babel/plugin-transform-block-scoping')
  )(babelModule, babelModule.exports);
  expect(module.exports).toEqual(babelModule.exports);
  expect(module.exports).toEqual([0, 1, 2]);
});

it('preserves this and arguments through captured-loop helpers', async () => {
  const source =
    'function run(offset){ const values=[]; for(let i=0;i<2;i++){ values.push(()=>this.base+arguments[0]+i); } return values.map(fn=>fn()); } module.exports=run.call({base:10},2);';
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  expect(module.exports).toEqual([12, 13]);
});

it('preserves await and yield through captured-loop helpers', async () => {
  const cases = [
    {
      source:
        'module.exports=(async()=>{ const callbacks=[]; for(let i=0;i<2;i++){ await Promise.resolve(); callbacks.push(()=>i); } return callbacks.map(fn=>fn()); })();',
      read: async (value: unknown) => await value,
      expected: [0, 1],
    },
    {
      source:
        'const callbacks=[]; function* run(){ for(let i=0;i<2;i++){ callbacks.push(()=>i); yield i; } } module.exports={values:[...run()],captured:callbacks.map(fn=>fn())};',
      read: async (value: unknown) => value,
      expected: { values: [0, 1], captured: [0, 1] },
    },
  ];

  for (const { source, read, expected } of cases) {
    const result = await transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source,
      options: options(),
      isDefaultExpoTransformer: true,
    });
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') continue;
    const module = { exports: undefined as unknown };
    Function('module', 'exports', result.result.code)(module, module.exports);
    expect(await read(module.exports)).toEqual(expected);
  }
});

it.each([
  [
    'object destructure',
    'module.exports = async ({ b }) => 42',
    /async\s+\(_p\)\s*=>\s*\{\s*var\s+\{\s*b\s*\}\s*=\s*_p;\s*return 42;/,
  ],
  [
    'renamed destructure with default',
    'module.exports = async ({ a: x = 7 }) => x',
    /var\s+\{\s*a:\s*x\s*=\s*7\s*\}\s*=\s*_p;/,
  ],
  [
    'array destructure',
    'module.exports = async ([a, ...rest]) => rest',
    /var\s+\[a,\s*\.\.\.rest\]\s*=\s*_p;/,
  ],
  [
    'default value',
    'module.exports = async (x = compute()) => x',
    /var x = _p === undefined \? compute\(\) : _p;/,
  ],
  [
    'commented nested default',
    'module.exports = async (value /* left */ = /* right */ choose(inner = 2)) => value',
    /var value = _p === undefined \? choose\(inner = 2\) : _p;/,
  ],
  [
    'Unicode binding default',
    'module.exports = async (π = compute()) => π',
    /var π = _p === undefined \? compute\(\) : _p;/,
  ],
  [
    'rest parameter',
    'module.exports = async (...rest) => rest.length',
    /\(\.\.\.rest\)\s*=>\s*\(async\s*\(\)\s*=>\s*\{\s*return rest\.length;/,
  ],
  [
    'rest parameter with block body',
    'module.exports = async (...rest) => { return rest.length; }',
    /\(\.\.\.rest\)\s*=>\s*\(async\s*\(\)\s*=>\s*\{\s*return rest\.length;/,
  ],
])('applies the maintained async-arrow workaround for %s', async (_name, source, expected) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toMatch(expected);
});

it.each([
  'module.exports = async (a, b) => a + b',
  'module.exports = async () => 42',
  'module.exports = ({ b }) => b',
  'module.exports = async function ({ b }) { return b }',
  'class C { async method({ b }) { return b } }',
  'module.exports = { async method({ b }) { return b } }',
])('does not over-apply the maintained async-arrow workaround to %s', async (source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toMatch(/\bvar _?\w+ = _p/);
});

it('preserves runtime behavior across maintained async-arrow rewrites', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `let calls = 0;
      const destructured = async ({ value = ++calls }) => value;
      const rest = async (...values) => values.join(':');
      module.exports = async () => [
        await destructured({}),
        await destructured({ value: 7 }),
        await rest('a', 'b'),
        calls,
      ];`,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  await expect((module.exports as () => Promise<unknown>)()).resolves.toEqual([1, 7, 'a:b', 1]);
});

it('preserves source mappings for a composite rest-parameter async-arrow rewrite', async () => {
  const source = `module.exports = async (...rest) => rest.length;`;
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  const original = originalPositionFor(
    new TraceMap({ version: 3, sources: [filename], ...result.result.map } as any),
    generatedPositionOf(result.result.code, 'rest.length')
  );

  expect(original).toMatchObject({ line: 1, column: source.indexOf('rest.length') });
});

it.each([
  [
    'declaration',
    'try {} finally { class C { static value = 42 } use(C) }',
    /var C = \(\(\) => \{\s*class C[\s\S]*return C;\s*\}\)\(\);/,
  ],
  [
    'expression',
    'try {} finally { use(class { method() {} }) }',
    /use\(\(\(\) => class \{ method\(\) \{\} \}\)\(\)\)/,
  ],
  [
    'nested block',
    'try {} finally { if (ok) { class C {} use(C) } }',
    /if \(ok\) \{\s*var C = \(\(\) => \{/,
  ],
])(
  'applies the maintained class-in-finally workaround for a %s',
  async (_name, source, expected) => {
    const result = await transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source,
      options: options(),
      isDefaultExpoTransformer: true,
    });
    if (result.status === 'fallback') throw new Error(result.reason);
    expect(result.result.code).toMatch(expected);
  }
);

it.each([
  'class C {}',
  'try { class C {} } catch (error) {}',
  'try {} catch (error) { class C {} }',
  'try {} finally { (() => { class C {} return C })() }',
  'try {} finally { class Outer { method() { class Inner {} return Inner } } }',
])('does not over-apply the maintained class-in-finally workaround to %s', async (source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  const wrappers = result.result.code.match(/var \w+ = \(\(\) =>/g) ?? [];
  expect(wrappers).toHaveLength(source.includes('class Outer') ? 1 : 0);
});

it('preserves class identity and heritage through the maintained finally rewrite', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `class Base { static base = 1 }
      try {} finally {
        class Value extends Base { static own = 2 }
        module.exports = [Value.name, Value.base, Value.own, new Value() instanceof Base]
      }`,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  const module = { exports: undefined as unknown };
  Function('module', 'exports', result.result.code)(module, module.exports);
  expect(module.exports).toEqual(['Value', 1, 2, true]);
});

it.each([
  ['getter', 'module.exports = { get value() { return super.value } }', 'get ["value"]()'],
  ['setter', 'module.exports = { set value(v) { super.value = v } }', 'set ["value"](v)'],
  [
    'string key',
    'module.exports = { get "weird key"() { return super.value } }',
    'get ["weird key"]()',
  ],
  [
    'nested arrow',
    'module.exports = { get value() { return (() => super.value)() } }',
    'get ["value"]()',
  ],
])('applies the maintained Hermes super workaround for a %s', async (_name, source, expected) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain(expected);
});

it.each([
  'module.exports = { get value() { return 1 } }',
  'module.exports = { value() { return super.value } }',
  'class Value extends Base { get value() { return super.value } }',
  'module.exports = { get value() { class C extends B { static { super.value } } return C } }',
  'module.exports = { get value() { class C extends B { field = super.value } return C } }',
])('does not over-apply the maintained Hermes super workaround to %s', async (source) => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).not.toMatch(/\b(?:get|set)\s+\[/);
});

it('preserves an already-computed object accessor in the maintained Hermes workaround', async () => {
  const source = 'module.exports = { get ["value"]() { return super.value } }';
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain('get ["value"]()');
});

it('passes Expo’s exact babelRuntimeVersion to native helper selection', async () => {
  const transform = (enableBabelRuntime: boolean | string) =>
    transformNodeModuleWithNoxcturnal({
      filename,
      projectRoot: '/app',
      source: 'async function* value() { yield 1 }',
      options: options(),
      enableBabelRuntime,
      isDefaultExpoTransformer: true,
    });

  const oldRuntime = await transform('6.0.0');
  expect(oldRuntime.status).toBe('complete');
  if (oldRuntime.status === 'complete') {
    expect(oldRuntime.result.code).toContain('babelHelpersFallback.wrapAsyncGenerator');
    expect(oldRuntime.result.code).not.toContain(
      'require("@babel/runtime/helpers/wrapAsyncGenerator")'
    );
  }

  const runtime = await transform('7.24.0');
  expect(runtime.status).toBe('complete');
  if (runtime.status === 'complete') {
    expect(runtime.result.code).toContain('require("@babel/runtime/helpers/wrapAsyncGenerator")');
    expect(runtime.result.code).not.toMatch(/\basync\s+function\s*\*/);
  }

  const inline = await transform(false);
  expect(inline.status).toBe('complete');
  if (inline.status === 'complete') {
    expect(inline.result.code).not.toContain('require(');
    expect(inline.result.code).not.toMatch(/\basync\s+function\s*\*|regeneratorRuntime/);
  }
});

it('preserves modern syntax supported by Hermes V1', async () => {
  const source =
    'class Value { field = 1 } async function load({ value = 1, ...rest }) { return [value, rest] }';
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status === 'complete') expect(result.result.code).toBe(source);
});

it('does not mistake generated SignedSource markers for JSX', async () => {
  const source =
    '/* @generated SignedSource<<e7f6759bcc8955193867c6ab42bd07ad>> */\nmodule.exports=1;';
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source,
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.result.code).toContain('module.exports = 1');
  expect(result.result.code).not.toContain('jsx-runtime');
});

it('lowers legacy-profile parameters through the native syntax phase', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      'module.exports = function read(value = 2, ...rest) { return [value, rest, read.length]; };',
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  const read = module.exports as (value?: number, ...rest: number[]) => unknown;
  expect(read(undefined, 3, 4)).toEqual([2, [3, 4], 0]);
});

it('lowers legacy-profile standalone destructuring through the native syntax phase', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      "const input = { value: 2, extra: 3 }; const { value, ...rest } = input; let first, tail; ([first, ...tail] = [4, 5, 6]); try { throw { message: 'ok' } } catch ({ message }) { module.exports = [value, rest.extra, first, tail, message]; }",
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toEqual([2, 3, 4, [5, 6], 'ok']);
});

it('lowers WebView-profile for-of through the native syntax phase', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      'let closed = false; function* values() { try { yield 1; yield 2 } finally { closed = true } } const output = []; for (const value of values()) { output.push(value); break } module.exports = [output, closed];',
    options: options({
      unstable_transformProfile: 'hermes-stable',
      customTransformOptions: { engine: 'hermes', dom: '1' },
    }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toEqual([[1], true]);
});

it('lowers legacy-profile classes through the native syntax phase', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      'class Value { constructor(value) { this.value = value } read() { return this.value } static create(value) { return new this(value) } } module.exports = Value.create(3).read();',
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toBe(3);
});

it('lowers legacy-profile private class features through the native syntax phase', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      'class Secret { #value = 2; #double(input) { return this.#value * input } read() { return this.#double(3) } has(input) { return #value in input } } const value = new Secret(); module.exports = [value.read(), value.has(value), value.has({})];',
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toEqual([6, true, false]);
});

it('lowers Flow private references captured by class-field arrows', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */
      class Registry {
        #value: number = 2;
        #read = (): number => this.#value;
        #callback = (): number => this.#read();
        result(): number { return this.#callback(); }
      }
      module.exports = new Registry().result();`,
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).not.toMatch(/#[A-Za-z_$]/);
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toBe(2);
});

it('retains value-less Flow private fields as runtime brands', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: `/** @flow */
      class Registry {
        #value: ?number;
        read(): ?number { return this.#value; }
      }
      module.exports = new Registry().read();`,
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  const module = { exports: null as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toBeUndefined();
});

it('preserves dotAll while lowering the regexp features selected by the legacy Babel profile', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source:
      "const expression = /(?<word>a).\\k<word>/s; const match = expression.exec('a\\na'); module.exports = [match[0], match.groups.word, 'a\\na'.replace(expression, '$<word>!'), /\\p{ASCII}+/u.test('abc'), /\\p{Script=Greek}+/u.test('Ω'), /\\p{Letter}/u.test('𐐀')];",
    options: options({ unstable_transformProfile: 'default' }),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  expect(result.result.code).toContain('/s');
  const module = { exports: undefined as unknown };
  Function('module', 'require', result.result.code)(module, requireFromMetroConfig);
  expect(module.exports).toEqual(['a\na', 'a', 'a!', true, true, true]);
});

it('emits Metro-compatible function maps without Babel traversal', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'var x=1; function named(a){ return a } var inferred = function(){ return x };',
    options: options(),
    isDefaultExpoTransformer: true,
  });

  expect(result.status).toBe('complete');
  if (result.status !== 'complete') return;
  // Differential value from Metro's functionMapBabelPlugin for this fixture.
  expect(result.result.functionMap).toEqual({
    names: ['<global>', 'named', 'inferred'],
    mappings: 'AAA,SC,6BD,gBE,sBF',
  });
});

it('lowers function-scope let and const declarations', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'const outer = 1; function value() { let inner = outer; return inner; }',
    options: options(),
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status === 'complete') {
    expect(result.result.code).toMatch(
      /var outer = 1;\s*function value\(\) \{\s*var inner = outer;\s*return inner;\s*\}/
    );
  }
});

it('renames and lowers nested block bindings without leaking collisions', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'var value = 0; if (condition) { const value = 1; consume(value); } consume(value);',
    options: options(),
    isDefaultExpoTransformer: true,
  });
  expect(result.status).toBe('complete');
  if (result.status === 'complete') {
    expect(result.result.code).toMatch(
      /var value = 0;\s*if \(condition\) \{\s*var (_value\d*) = 1;\s*consume\(\1\);\s*\}\s*consume\(value\);/
    );
  }
});

it('lowers loop bindings when per-iteration bindings are not captured', async () => {
  const result = await transformNodeModuleWithNoxcturnal({
    filename,
    projectRoot: '/app',
    source: 'for (let value of values) consume(value);',
    options: options(),
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  expect(result.status).toBe('complete');
  if (result.status === 'complete') {
    expect(result.result.code).toMatch(/for \(var value of values\) consume\(value\);/);
  }
});
