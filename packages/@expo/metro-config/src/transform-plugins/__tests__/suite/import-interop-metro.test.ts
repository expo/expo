import { IMPORT_DEFAULT_NAME, makeEval } from './utils';

// The rest of this suite evaluates output built with the self-contained interop wrappers.
// These tests instead run with Metro's `importDefault` helper, to check that the two paths
// agree on interop semantics, and to cover the ordering of module evaluation. Namespace
// imports keep the wrapper either way, and are covered here for the interaction with a
// default import of the same module.

const exec = makeEval({ importDefault: IMPORT_DEFAULT_NAME });

it('import default of an ES module', () => {
  const mod = exec({
    foo: 'export default 1; export const named = 2;',
    entry: 'import foo from "foo"; export const value = foo;',
  });
  expect(mod).toEqual({
    exports: { value: 1 },
    requests: ['foo'],
  });
});

it('import default of a CommonJS module', () => {
  const mod = exec({
    foo: 'module.exports = { named: 2 };',
    entry: 'import foo from "foo"; export const value = foo;',
  });
  expect(mod).toEqual({
    exports: { value: { named: 2 } },
    requests: ['foo'],
  });
});

it('import namespace of an ES module', () => {
  const mod = exec({
    foo: 'export default 1; export const named = 2;',
    entry: 'import * as ns from "foo"; export const value = { ...ns };',
  });
  expect(mod).toEqual({
    exports: { value: { default: 1, named: 2 } },
    requests: ['foo'],
  });
});

it('import namespace of a CommonJS module', () => {
  const mod = exec({
    foo: 'module.exports = { named: 2 };',
    entry: 'import * as ns from "foo"; export const value = { ...ns };',
  });
  expect(mod).toEqual({
    exports: { value: { named: 2, default: { named: 2 } } },
    requests: ['foo'],
  });
});

it('import namespace of a CommonJS module exporting a function', () => {
  const mod = exec({
    foo: 'module.exports = function () { return 1; };',
    entry: 'import * as ns from "foo"; export const value = ns.default;',
  });
  expect(mod).toEqual({
    exports: { value: expect.any(Function) },
    requests: ['foo'],
  });
  expect(mod.exports.value()).toBe(1);
});

// A CommonJS module of lazy getters is how `react-native` exposes its entry point, and
// several of its getters throw for modules an app hasn't linked. Neither import form may
// read a property to build its binding.
describe('CommonJS module with lazy getters', () => {
  const foo = `
    module.exports = {
      get safe() { return 1; },
      get explodes() { throw new Error('getter invoked'); },
    };
  `;

  it('does not invoke getters for a default import', () => {
    const mod = exec({
      foo,
      entry: 'import foo from "foo"; export const value = foo.safe;',
    });
    expect(mod.exports.value).toBe(1);
  });

  it('does not invoke getters for a namespace import', () => {
    const mod = exec({
      foo,
      entry: 'import * as ns from "foo"; export const value = ns.safe;',
    });
    expect(mod.exports.value).toBe(1);
  });

  it('still propagates a getter that the module body reads', () => {
    expect(() =>
      exec({
        foo,
        entry: 'import * as ns from "foo"; export const value = ns.explodes;',
      })
    ).toThrow('getter invoked');
  });
});

it('import default and named from the same module', () => {
  const mod = exec({
    foo: 'export default 1; export const named = 2;',
    entry: 'import foo, { named } from "foo"; export const value = [foo, named];',
  });
  expect(mod).toEqual({
    exports: { value: [1, 2] },
    requests: ['foo'],
  });
});

describe('module evaluation order', () => {
  // Imports are hoisted to the top of the output, so the log has to be set up out of band
  // rather than by the entry module.
  let order: string[];
  beforeEach(() => {
    order = [];
    (globalThis as any).__order = order;
  });
  afterEach(() => {
    delete (globalThis as any).__order;
  });

  it('evaluates a side-effect import before an unrelated one', () => {
    const mod = exec({
      foo: 'globalThis.__order.push("foo"); export default 1;',
      bar: 'globalThis.__order.push("bar");',
      entry: `
        import 'foo';
        import 'bar';
        import foo from 'foo';
        export const value = foo;
      `,
    });
    expect(mod.exports.value).toBe(1);
    expect(order).toEqual(['foo', 'bar']);
  });

  it('evaluates a module once when imported both bare and by default', () => {
    const mod = exec({
      foo: 'globalThis.__order.push("foo"); export default 1;',
      entry: `
        import 'foo';
        import foo from 'foo';
        export const value = foo;
      `,
    });
    expect(mod.exports.value).toBe(1);
    expect(order).toEqual(['foo']);
  });

  it('evaluates a side-effect import before a later namespace import', () => {
    const mod = exec({
      foo: 'globalThis.__order.push("foo"); export const named = 2;',
      bar: 'globalThis.__order.push("bar");',
      entry: `
        import 'foo';
        import 'bar';
        import * as ns from 'foo';
        export const value = ns.named;
      `,
    });
    expect(mod.exports.value).toBe(2);
    expect(order).toEqual(['foo', 'bar']);
  });
});
