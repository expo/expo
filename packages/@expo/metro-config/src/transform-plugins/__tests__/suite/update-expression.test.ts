import { makeEval } from './utils';

const exec = makeEval();

it('bigint', () => {
  const mod = exec({
    foo: 'export const x = "x";',
    entry: `
      export let foo = 1n;

      export let bar = foo++;

      export let baz = ++bar;

      expect(foo).toBe(2n);
      expect(bar).toBe(2n);
      expect(baz).toBe(2n);

      export { foo as foofoo, bar as barbar };
      export { baz as bazbaz };

      --foo;
      bar--;
      baz--;
      import { x } from 'foo';
      var y = true;
      function f() {
        return [x, y, console];
      }
    `,
  });
  expect(Object.keys(mod.exports)).toEqual(['foo', 'bar', 'baz', 'foofoo', 'barbar', 'bazbaz']);
  expect(mod.exports.foo).toBe(1n);
  expect(mod.exports.bar).toBe(1n);
  expect(mod.exports.baz).toBe(1n);
  expect(mod.exports.foofoo).toBe(1n);
  expect(mod.exports.barbar).toBe(1n);
  expect(mod.exports.bazbaz).toBe(1n);
});

it('negative suffix', () => {
  const mod = exec({
    entry: `
    export let diffLevel = 0;
    export function diff() {
      if (!--diffLevel) {
        throw new Error();
      }
    }
    `,
  });
  expect(mod).toEqual({
    exports: { diffLevel: 0, diff: expect.any(Function) },
    requests: [],
  });
  mod.exports.diff();
});

it('positive suffix', () => {
  const mod = exec({
    entry: `
    export let diffLevel = 0;
    export function diff() {
      if (!++diffLevel) {
        throw new Error();
      }
    }
    `,
  });
  expect(mod).toEqual({
    exports: { diffLevel: 0, diff: expect.any(Function) },
    requests: [],
  });
  mod.exports.diff();
});
