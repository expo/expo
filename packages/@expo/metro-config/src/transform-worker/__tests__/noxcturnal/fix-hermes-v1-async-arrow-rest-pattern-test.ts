import * as babel from '@babel/core';
import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';

import { transformNodeModuleWithNoxcturnal } from '../../noxcturnal/noxcturnal-transformer';

const filename = '/app/node_modules/example/index.js';

async function transform(
  source: string,
  overrides: Partial<JsTransformOptions> = {},
  inputFilename = filename
) {
  const result = await transformNodeModuleWithNoxcturnal({
    filename: inputFilename,
    projectRoot: '/app',
    source,
    options: {
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
    } as JsTransformOptions,
    isDefaultExpoTransformer: true,
  });
  if (result.status === 'fallback') throw new Error(result.reason);
  return result.result;
}

function canonicalCode(source: string) {
  return babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    compact: true,
    comments: false,
  })!.code!;
}

function generatedPositionOf(code: string, needle: string) {
  const offset = code.indexOf(needle);
  expect(offset).toBeGreaterThanOrEqual(0);
  const lines = code.slice(0, offset).split('\n');
  return { line: lines.length, column: lines.at(-1)!.length };
}

function expectSupportedAsyncRestParameters(code: string) {
  babel.traverse(babel.parseSync(code)!, {
    ArrowFunctionExpression({ node }) {
      const rest = node.params.at(-1);
      if (node.async && babel.types.isRestElement(rest)) {
        expect(babel.types.isIdentifier(rest.argument)).toBe(true);
      }
    },
  });
}

it.each([
  '[]',
  '[a]',
  '[a,b = {}]',
  '[,a]',
  '[...a]',
  '[[a]]',
  '[{a}]',
  '[a = fail()]',
  '[a,...[b]]',
  '[a,...{length}]',
  '{}',
  '{length}',
  '{0:a}',
  '{0:a = fail()}',
  '{[key()]:a}',
  '{...a}',
  '{0:{a}}',
])('rewrites Hermes V1 async arrows with rest binding %s without Babel', async (pattern) => {
  for (const prefix of ['', 'x, ', 'x = 1, ', '{x}, ', '[x], ']) {
    for (const body of ['1', '{ return 1; }']) {
      const arrow = `async (${prefix}...${pattern}) => ${body}`;
      for (const source of [
        `module.exports = ${arrow};`,
        `module.exports = true ? ${arrow} : null;`,
      ]) {
        const result = await transform(source);
        expectSupportedAsyncRestParameters(result.code);
        expect(result.code).toMatch(/async\s*\(/);
      }
    }
  }
  for (const [source, overrides] of [
    [`module.exports = async (...${pattern}) => 1;`, { platform: 'web' }],
    [`module.exports = (...${pattern}) => 1;`, {}],
    [`module.exports = async function (...${pattern}) { return 1; };`, {}],
  ] as const) {
    const result = await transform(source, overrides);
    expect(canonicalCode(result.code)).toBe(canonicalCode(source));
  }
});

it('preserves async rest binding scope, rejection, lexical captures, and mappings without Babel', async () => {
  const source = `function make(offset) {
    return async (read = () => value, ...[value]) => {
      await Promise.resolve();
      return [read(), this.base, eval('this.base'), arguments[0]];
    };
  }
  const read = make.call({base: 3}, 9);
  const nested = async (...[a]) => (async (...{0: b}) => a + b)(2);
  const fail = async (...[value = (() => { throw new Error('parameter'); })()]) => value;
  const defaultArrow = async (read = async (...[a]) => a, ...[value]) => read(value);
  const sized = async (first, second = 2, ...[third]) => [first, second, third];
  const objectFail = async (...{[(() => { throw new Error('key'); })()]: value}) => value;
  const scoped = async (first = _arg, ...[second = typeof local]) => {
    var local = 1; return [first, second, _rest];
  };
  const _arg = 7, _rest = 9;
  const inherited = new (class extends class {value() { return 4; }} {
    value() { return (async (...[a]) => super.value() + a)(3); }
  });
  function Make() { return async (...[a]) => [new.target === Make, a]; }
  module.exports = {read, nested, defaultArrow, fail, sized, objectFail, scoped, inherited, constructed: new Make()};`;
  const result = await transform(source);
  expectSupportedAsyncRestParameters(result.code);
  const module = { exports: undefined as any };
  // eslint-disable-next-line no-new-func -- Execute the transformed fixture in the test's realm.
  Function('module', result.code)(module);
  await expect(module.exports.read.call({ base: 100 }, undefined, 42)).resolves.toEqual([
    42, 3, 3, 9,
  ]);
  await expect(module.exports.nested(1)).resolves.toBe(3);
  await expect(module.exports.defaultArrow(undefined, 42)).resolves.toBe(42);
  await expect(module.exports.fail()).rejects.toThrow('parameter');
  expect(module.exports.sized.length).toBe(1);
  await expect(module.exports.sized(1, undefined, 3)).resolves.toEqual([1, 2, 3]);
  await expect(module.exports.objectFail()).rejects.toThrow('key');
  await expect(module.exports.scoped()).resolves.toEqual([7, 'undefined', 9]);
  await expect(module.exports.inherited.value()).resolves.toBe(7);
  await expect(module.exports.constructed(8)).resolves.toEqual([true, 8]);
  const original = originalPositionFor(
    new TraceMap({ version: 3, sources: [filename], ...result.map } as any),
    generatedPositionOf(result.code, 'read()')
  );
  expect(original).toMatchObject({ line: 4, column: source.split('\n')[3]!.indexOf('read()') });
});

it('rewrites TypeScript tuple-typed rest bindings without Babel', async () => {
  const result = await transform(
    `module.exports = async (
    ...[input, options = {}]: [string, {retries?: number}?]
  ) => [input, options];`,
    {},
    '/app/node_modules/example/index.ts'
  );
  expectSupportedAsyncRestParameters(result.code);
  const module = { exports: undefined as any };
  // eslint-disable-next-line no-new-func -- Execute the transformed fixture in the test's realm.
  Function('module', result.code)(module);
  await expect(module.exports('input')).resolves.toEqual(['input', {}]);
});
