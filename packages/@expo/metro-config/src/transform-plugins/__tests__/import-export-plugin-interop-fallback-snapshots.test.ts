import generate from '@babel/generator';

import { importExportLiveBindingsPlugin } from '../index';
import { transformToAst } from './__mocks__/test-helpers-upstream';

// When the `importDefault` option is unset, the plugin emits a self-contained interop
// wrapper instead of a call to Metro's `importDefault` helper, so that the output can be
// evaluated without Metro's runtime. These snapshots pin that fallback output.

const getExpected = (code: string) =>
  generate(transformToAst([importExportLiveBindingsPlugin], code, {})).code;

let n = 0;
const test =
  (name: string) =>
  ([code]: readonly string[]): [string, string] => [`${++n}. ${name}`, code!];

it.each([
  test('import default')`
    import AppleIcons from 'apple-icons';
    test(AppleIcons);
  `,
  test('import namespace')`
    import * as AppleIcons from 'apple-icons';
    test(AppleIcons);
  `,
  test('import default + namespace')`
    import AppleIcons, * as AllAppleIcons from 'apple-icons';
    test(AppleIcons, AllAppleIcons);
  `,
  test('import default + named')`
    import AppleIcons, { Apple } from 'apple-icons';
    test(AppleIcons, Apple);
  `,
  test('import default from multiple modules (single wrapper helper)')`
    import AppleIcons from 'apple-icons';
    import AndroidIcons from 'android-icons';
    test(AppleIcons, AndroidIcons);
  `,
  test('import namespace from multiple modules (single wrapper helper)')`
    import * as AppleIcons from 'apple-icons';
    import * as AndroidIcons from 'android-icons';
    test(AppleIcons, AndroidIcons);
  `,
  test('import default unused (wrapper eliminated)')`
    import AppleIcons from 'apple-icons';
  `,
  test('import side effect + default import of same module')`
    import 'apple-icons';
    import AppleIcons from 'apple-icons';
    test(AppleIcons);
  `,
  test('import side effect ordered before an unrelated side effect')`
    import 'apple-icons';
    import 'android-icons';
    import AppleIcons from 'apple-icons';
    test(AppleIcons);
  `,
  test('export namespace by specifier')`
    export * as AppleIcons from 'apple-icons';
  `,
  test('export default by specifier')`
    export { default } from 'apple-icons';
  `,
])('%s', (_name, code) => {
  expect(getExpected(code)).toMatchSnapshot();
});
