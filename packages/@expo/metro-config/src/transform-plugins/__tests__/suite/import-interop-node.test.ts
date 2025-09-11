import { makeEval } from './utils';

const exec = makeEval();

it('module.exports function', () => {
  const mod = exec({
    foo: 'module.exports = function () { return 1; };',
    entry: 'export { default } from "foo";',
  });
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: ['foo'],
  });
  expect(mod.exports.default()).toBe(1);
});

it('module.exports __esModule function', () => {
  const mod = exec({
    foo: `
      module.exports = function () { return 1; };
      module.exports.__esModule = true;
    `,
    entry: 'export { default } from "foo";',
  });
  expect(mod).toEqual({
    exports: { default: undefined },
    requests: ['foo'],
  });
});

it('exports.default function', () => {
  const mod = exec({
    foo: `
      exports.default = function () { return 1; };
    `,
    entry: 'export { default } from "foo";',
  });
  expect(mod).toEqual({
    exports: { default: { default: expect.any(Function) } },
    requests: ['foo'],
  });
  expect(mod.exports.default.default()).toBe(1);
});

it('exports.default __esModule function', () => {
  const mod = exec({
    foo: `
      exports.default = function () { return 1; };
      exports.__esModule = true;
    `,
    entry: 'export { default } from "foo";',
  });
  expect(mod).toEqual({
    exports: { default: expect.any(Function) },
    requests: ['foo'],
  });
  expect(mod.exports.default()).toBe(1);
});

it('exports.named function', () => {
  const mod = exec({
    foo: `
      exports.named = function () { return 1; };
    `,
    entry: 'export { default, named } from "foo";',
  });
  expect(mod).toEqual({
    exports: {
      default: { named: expect.any(Function) },
      named: expect.any(Function),
    },
    requests: ['foo'],
  });
  expect(mod.exports.named()).toBe(1);
});

it('exports.named __esModule function', () => {
  const mod = exec({
    foo: `
      exports.named = function () { return 1; };
      exports.__esModule = true;
    `,
    entry: 'export { named } from "foo";',
  });
  expect(mod).toEqual({
    exports: { named: expect.any(Function) },
    requests: ['foo'],
  });
  expect(mod.exports.named()).toBe(1);
});
