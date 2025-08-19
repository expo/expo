import generate from '@babel/generator';

import { importExportPlugin } from '../import-export-plugin';
import { transformToAst } from './__mocks__/test-helpers-upstream';

// This file includes test for functionality that was added to the import-export-plugin
// and has not been upstreamed yet.

const opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

const test =
  (name: string) =>
  ([code]: readonly string[]) => [name, code];

describe.each([
  ['with live bindings', true],
  ['without live bindings', false],
])('%s', (_message, liveBindings) => {
  const getExpected = (code: string) =>
    generate(transformToAst([importExportPlugin], code, { ...opts, liveBindings })).code;

  it.each([
    // Exports
    test('export namespace by specifier')`
      export * as AppleIcons from 'apple-icons';
    `,
    test('export namespace as default')`
      export * as default from 'apple-icons';
    `,
    test('re-export all')`
      export * from 'apple-icons';
    `,
    test('re-export namespaces combined cases (1)')`
      export * from 'apple-icons';
      export * as AppleIcons from 'apple-icons';
      export * as default from 'apple-icons';
    `,
    test('re-export namespaces combined cases (2)')`
      export * as AppleIcons from 'apple-icons';
      export * from 'apple-icons';
      export * as default from 'apple-icons';
    `,
    test('re-export namespaces combined cases (3)')`
      export * as default from 'apple-icons';
      export * as AppleIcons from 'apple-icons';
      export * from 'apple-icons';
    `,
    test('re-export namespaces combined cases (4)')`
      export * as default from 'apple-icons';
      export * from 'apple-icons';
      export * as AppleIcons from 'apple-icons';
    `,
    test('re-export specifier')`
      export { test } from 'apple-icons';
    `,
    test('re-export default')`
      export { default } from 'apple-icons';
    `,
    test('re-export default as local')`
      export { default as local } from 'apple-icons';
    `,
    test('re-export combined cases (1)')`
      export { default as _test, default, test } from 'apple-icons';
    `,
    test('re-export combined cases (2)')`
      export { default as _test, test, default } from 'apple-icons';
    `,
    test('re-export combined cases (3)')`
      export { test, default, default as _test } from 'apple-icons';
    `,
    test('re-export combined cases (4)')`
      export { test, default as _test, default } from 'apple-icons';
    `,
    test('re-export all + namespaces')`
      export { test, default as _test } from 'apple-icons';
      export * from 'apple-icons';
      export * as AppleIcons from 'apple-icons';
      export * as default from 'apple-icons';
    `,

    // Imports
    test('import namespace by specifier')`
      import * as AppleIcons from 'apple-icons';
      test(AppleIcons);
    `,
    test('import default')`
      import AppleIcons from 'apple-icons';
      test(AppleIcons);
    `,
    test('import specifier')`
      import { test } from 'apple-icons';
      test(test);
    `,
    test('import specifier as local')`
      import { test as local } from 'apple-icons';
      test(local);
    `,
    test('import default specifier as local')`
      import { default as local } from 'apple-icons';
      test(local);
    `,
    test('import specifier, and default')`
      import AppleIcons, { test } from 'apple-icons';
      test(AppleIcons, test);
    `,
    test('import specifier as local, and default')`
      import AppleIcons, { test as local } from 'apple-icons';
      test(AppleIcons, local);
    `,
    test('import default specifier as local, and default')`
      import _AppleIcons, { default as local } from 'apple-icons';
      test(_AppleIcons, local);
    `,
    test('import combined cases (1)')`
      import a, { b, default as c, test as d } from 'apple-icons';
      test(a, b, c, d);
    `,
    test('import combined cases (2)')`
      import a, { default as c, b, test as d } from 'apple-icons';
      test(a, b, c, d);
    `,
    test('import combined cases (3)')`
      import a, { default as c, test as d, b } from 'apple-icons';
      test(a, b, c, d);
    `,
    test('import combined cases (4)')`
      import a, { test as d, b, default as c } from 'apple-icons';
      test(a, b, c, d);
    `,

    // Import then export
    test('export imported namespace by specifier')`
      import * as AppleIcons from 'apple-icons';
      export { AppleIcons };
    `,
    test('export import default')`
      import AppleIcons from 'apple-icons';
      export { AppleIcons };
    `,
    test('export import specifier')`
      import { test } from 'apple-icons';
      export { test };
    `,
    test('export import specifier with local')`
      import { test as local } from 'apple-icons';
      export { local };
    `,
    test('export import default specifier as local')`
      import { default as local } from 'apple-icons';
      export { local };
    `,
    test('export import specifier and default')`
      import AppleIcons, { test } from 'apple-icons';
      export { AppleIcons, test };
    `,
    test('export import specifier as local, and default')`
      import AppleIcons, { test as local } from 'apple-icons';
      export { AppleIcons, local };
    `,
    test('export import default specifier as local, and default')`
      import _AppleIcons, { default as local } from 'apple-icons';
      export { _AppleIcons, local };
    `,

    // Import then export default
    test('export-default imported namespace by specifier')`
      import * as AppleIcons from 'apple-icons';
      export default AppleIcons;
    `,
    test('export-default import default')`
      import AppleIcons from 'apple-icons';
      export default AppleIcons;
    `,
    test('export-default import specifier')`
      import { test } from 'apple-icons';
      export default test;
    `,
    test('export-default import specifier as local')`
      import { test as local } from 'apple-icons';
      export default local;
    `,
    test('export-default import default specifier as local')`
      import { default as local } from 'apple-icons';
      export default local;
    `,

    // Export variable declaration
    test('export-named imported namespace by specifier')`
      import * as _AppleIcons from 'apple-icons';
      export const AppleIcons = _AppleIcons;
    `,
    test('export-named import default')`
      import _AppleIcons from 'apple-icons';
      export const AppleIcons = _AppleIcons;
    `,
    test('export-named import specifier')`
      import { test } from 'apple-icons';
      export const _test = test;
    `,
    test('export-named import specifier as local')`
      import { test as local } from 'apple-icons';
      export const test = local;
    `,
    test('export-named import default specifier as local')`
      import { default as local } from 'apple-icons';
      export const _local = local;
    `,

    // Export destructure object
    test('export destructured object from imported namespace by specifier')`
      import * as AppleIcons from 'apple-icons';
      export const { a, b } = AppleIcons;
    `,
    test('export destructured object from import default')`
      import AppleIcons from 'apple-icons';
      export const { a, b } = AppleIcons;
    `,
    test('export destructured object from import specifier')`
      import { test } from 'apple-icons';
      export const { a, b } = test;
    `,
    test('export destructured object from import specifier as local')`
      import { test as local } from 'apple-icons';
      export const { a, b } = local;
    `,
    test('export destructured object from import default specifier as local')`
      import { default as local } from 'apple-icons';
      export const { a, b } = local;
    `,

    // Export destructure array
    test('export destructured array from imported namespace by specifier')`
      import * as AppleIcons from 'apple-icons';
      export const [a, b] = AppleIcons;
    `,
    test('export destructured array from import default')`
      import AppleIcons from 'apple-icons';
      export const [a, b] = AppleIcons;
    `,
    test('export destructured array from import specifier')`
      import { test } from 'apple-icons';
      export const [a, b] = test;
    `,
    test('export destructured array from import specifier as local')`
      import { test as local } from 'apple-icons';
      export const [a, b] = local;
    `,
    test('export destructured array from import default specifier as local')`
      import { default as local } from 'apple-icons';
      export const [a, b] = local;
    `,
  ])('transforms %s', (_name, code) => {
    expect(getExpected(code)).toMatchSnapshot();
  });
});
