import { transformSync } from '@babel/core';

import plugin from '../babel-plugin-transform-export-namespace-from';

// Executes similar scenarios as original test suit
// https://github.com/babel/babel/tree/e5c8dc7330cb2f66c37637677609df90b31ff0de/packages/babel-plugin-transform-export-namespace-from/test/fixtures/export-namespace/

it('transforms export namespace from syntax', () => {
  const input = `export * as foo from "bar";`;

  const expected = `import * as _foo from "bar";
export { _foo as foo };`;

  const result = transform(input);
  expect(result).toBe(expected);
});

it('transforms export namespace from syntax with string name', () => {
  const input = `export * as "some exports" from "foo";`;

  const expected = `import * as _someExports from "foo";
export { _someExports as "some exports" };`;

  const result = transform(input);
  expect(result).toBe(expected);
});

it('transforms export namespace from syntax with default name', () => {
  const input = `export * as default from "foo";`;

  const expected = `import * as _default from "foo";
export { _default as default };`;

  const result = transform(input);
  expect(result).toBe(expected);
});

function transform(code: string) {
  const result = transformSync(code, {
    plugins: [plugin],
    configFile: false,
    babelrc: false,
  });

  return result.code || '';
}
