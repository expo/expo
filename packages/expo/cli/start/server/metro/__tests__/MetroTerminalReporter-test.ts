import { stripAnsi } from '../../../../utils/ansi';
import { stripMetroInfo, formatUsingNodeStandardLibraryError } from '../MetroTerminalReporter';

describe(stripMetroInfo, () => {
  it(`sanitizes`, () => {
    const input = [
      'Unable to resolve module path from /Users/evanbacon/Documents/GitHub/examples/with-apple-auth/App.js: path could not be found within the project or in these directories:',
      '  node_modules',
      '  ../../node_modules',
      '  ../../../../node_modules',
      '',
      'If you are sure the module exists, try these steps:',
      ' 1. Clear watchman watches: watchman watch-del-all',
      ' 2. Delete node_modules and run yarn install',
      " 3. Reset Metro's cache: yarn start --reset-cache",
      ' 4. Remove the cache: rm -rf /tmp/metro-*',
      '\x1B[0m \x1B[90m 77 |\x1B[39m }\x1B[0m',
      '\x1B[0m \x1B[90m 78 |\x1B[39m\x1B[0m',
      '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 79 |\x1B[39m \x1B[36mimport\x1B[39m \x1B[32m"path"\x1B[39m\x1B[33m;\x1B[39m\x1B[0m',
      '\x1B[0m \x1B[90m    |\x1B[39m         \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m',
      '\x1B[0m \x1B[90m 80 |\x1B[39m\x1B[0m',
    ].join('\n');
    expect(stripAnsi(stripMetroInfo(input))).toMatchInlineSnapshot(`
      "  77 | }
        78 |
      > 79 | import \\"path\\";
           |         ^
        80 |"
    `);
  });
});

describe(formatUsingNodeStandardLibraryError, () => {
  it(`formats node standard library error`, () => {
    const format = formatUsingNodeStandardLibraryError('/Users/evanbacon/my-app', {
      message: 'foobar',
      originModulePath: '/Users/evanbacon/my-app/App.js',
      targetModuleName: 'path',
    } as any);
    expect(stripAnsi(format)).toMatchInlineSnapshot(`
      "You attempted attempted to import the Node standard library module \\"path\\" from \\"App.js\\".
      It failed because the native React runtime does not include the Node standard library.
      Learn more: https://docs.expo.dev/workflow/using-libraries/#using-third-party-libraries"
    `);
  });
});
