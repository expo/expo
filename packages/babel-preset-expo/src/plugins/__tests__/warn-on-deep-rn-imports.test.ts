import * as babel from '@babel/core';

import plugin from '../warn-on-deep-rn-imports';

function transform(code: string) {
  return babel.transform(code, {
    filename: '/app/src/file.js',
    babelrc: false,
    configFile: false,
    plugins: [plugin],
  })!.code!;
}

it('warns on react-native/Libraries deep imports', () => {
  const code = transform(`import LogBox from 'react-native/Libraries/LogBox/LogBox';`);
  expect(code).toContain("Deep imports from the 'react-native' package are deprecated");
  expect(code).toContain('react-native/Libraries/LogBox/LogBox');
});

it('does not warn on InitializeCore or the unstable-internals entry point', () => {
  const code = transform(`
    require('react-native/Libraries/Core/InitializeCore');
    import { NativeSourceCode } from 'react-native/unstable-internals-do-not-use';
  `);
  expect(code).not.toContain('deprecated');
});
