import type { NodePath } from '@babel/core';
import { parseSync, transformSync, traverse, types as t } from '@babel/core';

const preset = require('../configs/hermes-v1');

function transform(source: string) {
  return transformSync(source, { babelrc: false, configFile: false, presets: [preset] })!.code!;
}

function expectSupportedAsyncRestParameters(code: string) {
  traverse(parseSync(code)!, {
    ArrowFunctionExpression({ node }) {
      const rest = node.params.at(-1);
      if (node.async && t.isRestElement(rest)) {
        expect(t.isIdentifier(rest.argument)).toBe(true);
      }
    },
  });
}

function evaluate(source: string) {
  const code = transform(source);
  expectSupportedAsyncRestParameters(code);
  const module = { exports: undefined as any };
  // eslint-disable-next-line no-new-func -- Execute the transformed fixture in the test's realm.
  Function('module', code)(module);
  return module.exports;
}

const restPatterns = [
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
];

it.each(restPatterns)('rewrites async arrows with rest binding %s', (pattern) => {
  for (const prefix of ['', 'x, ', 'x = 1, ', '{x}, ', '[x], ']) {
    for (const body of ['1', '{ return 1; }']) {
      const result = transform(`module.exports = async (${prefix}...${pattern}) => ${body};`);
      expectSupportedAsyncRestParameters(result);
      expect(result).toMatch(/async\s*\(/);
    }
  }
});

it('leaves supported parameters and other function forms unchanged', () => {
  expectSupportedAsyncRestParameters(transform('async (...[]) => 1;'));
  const source = `module.exports = [
    async (a = 1) => a, async ({a}) => a, async ([...a]) => a,
    async (...args) => args, (...[a]) => a, async function (...[a]) { return a; },
    { async method(...{length}) { return length; } },
  ];`;
  expect(transform(source)).toBe(
    transformSync(source, { babelrc: false, configFile: false, comments: false, compact: true })!
      .code
  );
});

it('preserves parameter scope, function length, and lexical captures', async () => {
  const make = evaluate(`module.exports = function (offset) {
    return async (read = () => a, ...[a]) => {
      await Promise.resolve();
      return [read(), this.base, arguments[0]];
    };
  };`);
  const fn = make.call({ base: 3 }, 9);
  expect(fn.length).toBe(0);
  await expect(fn(undefined, 42)).resolves.toEqual([42, 3, 9]);
});

it.each(['[a = fail()]', '{0: a = fail()}', '{[fail()]: a}'])(
  'rejects initialization errors in rest binding %s',
  async (pattern) => {
    const fn = evaluate(`const fail = () => { throw new Error('parameter'); };
    module.exports = async (...${pattern}) => { throw new Error('body'); };`);
    const result = fn();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).rejects.toThrow('parameter');
  }
);

it('preserves lexical super and nested async arrows', async () => {
  const fn = evaluate(`module.exports = new (class extends class { value() { return 4; } } {
    value() { return (async (...[a]) => (async (...{0:b}) => super.value() + a + b)(2))(3); }
  });`);
  await expect(fn.value()).resolves.toBe(9);
});

it('preserves lexical this through direct eval and a changed call receiver', async () => {
  const make = evaluate(`module.exports = function () {
    return async (...[value]) => [this.base, eval('this.base'), value];
  };`);
  const fn = make.call({ base: 10 });
  await expect(fn.call({ base: 100 }, 2)).resolves.toEqual([10, 10, 2]);
});

it('preserves length and default initialization order with preceding parameters', async () => {
  const fn =
    evaluate(`module.exports = async (first, {second}, third = 3, ...[fourth = third + 1]) =>
    [first, second, third, fourth];`);
  expect(fn.length).toBe(2);
  await expect(fn(1, { second: 2 })).resolves.toEqual([1, 2, 3, 4]);
});

it('preserves parameter/body scope separation and generated-name collisions', async () => {
  const fn = evaluate(`const _arg = 7, _rest = 9;
    module.exports = async (first = _arg, ...[second = typeof local]) => {
      var local = 1;
      return [first, second, _rest];
    };`);
  await expect(fn()).resolves.toEqual([7, 'undefined', 9]);
});

it('preserves initialization order and promise scheduling', async () => {
  const make = evaluate(`module.exports = (events) => async (
    first = (events.push('first'), 1), ...[second = (events.push('second'), 2)]
  ) => { events.push('body'); return first + second; };`);
  const events: string[] = [];
  const result = make(events)();
  events.push('caller');
  result.then(() => events.push('then'));
  Promise.resolve().then(() => events.push('tick'));
  await expect(result).resolves.toBe(3);
  expect(events).toEqual(['first', 'second', 'body', 'caller', 'then', 'tick']);
});

it('preserves lexical new.target', async () => {
  const make = evaluate(`module.exports = function Make() {
    return async (...[value]) => [new.target === Make, value];
  };`);
  await expect(new make()(7)).resolves.toEqual([true, 7]);
});

it('rewrites nested async rest bindings in parameter initializers', async () => {
  const fn = evaluate(`module.exports = async (
    read = async (...[value]) => value, ...[input]
  ) => read(input);`);
  await expect(fn(undefined, 42)).resolves.toBe(42);
});

it.each(restPatterns)(
  'rewrites rest binding %s parsed as an expression in Flow conditionals',
  (pattern) => {
    for (const prefix of ['', 'read = () => a, ', 'read: () => number = () => a, ']) {
      for (const annotation of ['', ': any']) {
        const source = `module.exports = true ? async (${prefix}...${pattern}${annotation}) => { return a; } : null;`;
        const code = transformSync(source, {
          babelrc: false,
          configFile: false,
          presets: [preset],
          parserOpts: { plugins: ['flow'] },
          plugins: [require('@babel/plugin-transform-flow-strip-types')],
        })!.code!;
        expectSupportedAsyncRestParameters(code);
        expect(code).toMatch(/async\s*\(/);
      }
    }
  }
);

it('rewrites TypeScript tuple-typed rest bindings', () => {
  const code = transformSync(
    `module.exports = async (
    ...[input, options = {}]: [string, {retries?: number}?]
  ) => [input, options];`,
    {
      babelrc: false,
      configFile: false,
      filename: 'input.ts',
      presets: [preset],
      plugins: [require('@babel/plugin-transform-typescript')],
    }
  )!.code!;
  expectSupportedAsyncRestParameters(code);
  expect(code).toMatch(/async\s*\(/);
});

it.each([false, true])('keeps Babel parameter bindings accurate (Flow: %s)', (flow) => {
  transformSync(
    `module.exports = true ? async (read = () => a, ...[a]) => { return read(); } : null;`,
    {
      babelrc: false,
      configFile: false,
      presets: [preset],
      parserOpts: { plugins: flow ? ['flow'] : [] },
      plugins: [
        () => ({
          visitor: {
            ArrowFunctionExpression: {
              exit(path: NodePath<t.ArrowFunctionExpression>) {
                const expected = path.node.params.flatMap((param) =>
                  Object.keys(t.getBindingIdentifiers(param))
                );
                const actual = Object.entries(path.scope.bindings)
                  .filter(([, binding]) => binding.kind === 'param')
                  .map(([name]) => name);
                expect(actual.sort()).toEqual(expected.sort());
              },
            },
          },
        }),
      ],
    }
  );
});
