import { Terminal } from '@expo/metro/metro-core';
import arg = require('arg');
import { stripVTControlCharacters } from 'node:util';

import { stripAnsi } from '../../../../utils/ansi';
import {
  maybeSymbolicateAndFormatJSErrorStackLogAsync,
  parseErrorStringToObject,
} from '../../serverLogLikeMetro';
import {
  formatUsingNodeStandardLibraryError,
  isNodeStdLibraryModule,
  MetroTerminalReporter,
  stripMetroInfo,
} from '../MetroTerminalReporter';
import { BundleDetails } from '../TerminalReporter.types';
import {
  LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_52,
  LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_54,
  LOG_MULTIPLE_ERRORS_AND_OTHER_VALUES_SDK_54,
} from './fixtures/terminal-logs';

const asBundleDetails = (value: any) => value as BundleDetails;

jest.useFakeTimers();

jest.mock('../../serverLogLikeMetro', () => {
  const original = jest.requireActual('../../serverLogLikeMetro');
  return {
    ...original,
    parseErrorStringToObject: jest.fn(original.parseErrorStringToObject),
    maybeSymbolicateAndFormatJSErrorStackLogAsync: jest.fn(),
  };
});

describe('symbolicate React stacks', () => {
  const buildID = '1';

  const terminal = {
    // Only the bare minimum to pass the tests.
    log: jest.fn(),
    persistStatus: jest.fn(),
    status: jest.fn(),
    flush: jest.fn(),
    _update: jest.fn(),
  } satisfies Partial<Terminal>;

  const reporter = new MetroTerminalReporter('/', terminal as any);
  reporter._getElapsedTime = jest.fn(() => BigInt(100));
  reporter._bundleTimers.set(buildID, BigInt(0));

  beforeEach(() => {
    terminal.log.mockReset();
  });

  it(`should symbolicate a react error stack - SDK 52 style`, async () => {
    let parsedError: any;
    jest
      .mocked(maybeSymbolicateAndFormatJSErrorStackLogAsync)
      .mockImplementationOnce((_projectRoot, _level, error) => {
        parsedError = error;
        return Promise.resolve({
          isFallback: false,
          stack: '\n\n  at App.js:1:1\n  at index.js:2:2',
        });
      });

    reporter._log(LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_52 as any);
    expect(parseErrorStringToObject).toHaveBeenCalledWith(
      expect.stringMatching(
        /http:\/\/192.168.1.245:8081\/packages\/expo-router\/entry.bundle\/\/&platform=ios/
      )
    );

    expect(maybeSymbolicateAndFormatJSErrorStackLogAsync).toHaveBeenCalledTimes(1);

    expect(parsedError.message).toEqual(
      'Warning: Text strings must be rendered within a <Text> component.'
    );
    expect(parsedError.stack[1]).toEqual({
      arguments: [],
      column: 42,
      file: 'http://192.168.1.245:8081/packages/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=__e2e__%2Fstatic-rendering%2Fapp&unstable_transformProfile=hermes-stable',
      lineNumber: 62489,
      methodName: 'View',
    });

    // Wait for mocked symbolication promise to resolve.
    await jest.runAllTimersAsync();

    expect(terminal.log).toHaveBeenCalledTimes(1);
    expect(stripVTControlCharacters(terminal.log.mock.calls[0].join(''))).toMatchInlineSnapshot(`
" ERROR 

  at App.js:1:1
  at index.js:2:2"
`);
  });

  it(`should symbolicate a react error stack - SDK 54 style`, async () => {
    const parsedErrorsSentToSymbolication: any[] = [];
    jest
      .mocked(maybeSymbolicateAndFormatJSErrorStackLogAsync)
      .mockImplementationOnce((_projectRoot, _level, error) => {
        parsedErrorsSentToSymbolication.push(error);
        return Promise.resolve({
          isFallback: false,
          stack: '\n\n  at App.js:1:1\n  at index.js:2:2',
        });
      })
      .mockImplementationOnce((_projectRoot, _level, error) => {
        parsedErrorsSentToSymbolication.push(error);
        return Promise.resolve({
          isFallback: false,
          stack: '\n\n  at App2.js:1:1\n  at index2.js:2:2',
        });
      });

    reporter._log(LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_54 as any);
    expect(parseErrorStringToObject).toHaveBeenCalledWith(
      expect.stringMatching(
        /http:\/\/localhost:8081\/packages\/expo-router\/entry.bundle\/\/&platform=ios/
      )
    );

    expect(maybeSymbolicateAndFormatJSErrorStackLogAsync).toHaveBeenCalledTimes(2);

    // Only data string items containing a stack should be sent for symbolication.
    expect(parsedErrorsSentToSymbolication).toHaveLength(2);
    expect(parsedErrorsSentToSymbolication[0].message).toEqual('');
    expect(parsedErrorsSentToSymbolication[0].stack[2]).toEqual({
      arguments: [],
      column: 66,
      file: 'http://localhost:8081/packages/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.expo.routere2e&transform.routerRoot=__e2e__%2Fstatic-rendering%2Fapp&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable',
      lineNumber: 5517,
      methodName: '_construct',
    });
    expect(parsedErrorsSentToSymbolication[1].message).toEqual('');
    expect(parsedErrorsSentToSymbolication[1].stack[1]).toEqual({
      arguments: [],
      column: 72,
      file: 'http://localhost:8081/packages/expo-router/entry.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.expo.routere2e&transform.routerRoot=__e2e__%2Fstatic-rendering%2Fapp&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable',
      lineNumber: 63388,
      methodName: 'View',
    });

    await jest.runAllTimersAsync();

    expect(terminal.log).toHaveBeenCalledTimes(1);
    expect(stripVTControlCharacters(terminal.log.mock.calls[0].join(''))).toMatchInlineSnapshot(`
" ERROR Text strings must be rendered within a <Text> component.

  at App.js:1:1
  at index.js:2:2

  at App2.js:1:1
  at index2.js:2:2"
`);
  });

  it(`should symbolicate multiple errors stacks - SDK 54 style`, async () => {
    jest
      .mocked(maybeSymbolicateAndFormatJSErrorStackLogAsync)
      .mockResolvedValueOnce({
        // First error in console.error call
        isFallback: false,
        stack: '\n\n  at App.js:1:1\n  at index.js:2:2',
      })
      .mockResolvedValueOnce({
        // Second error in console.error call
        isFallback: false,
        stack: '\n\n  at App2.js:1:1\n  at index2.js:2:2',
      })
      .mockResolvedValueOnce({
        // Owner stack generated for the call
        isFallback: false,
        stack: '\n\n  at App3.js:1:1\n  at index3.js:2:2',
      });

    reporter._log(LOG_MULTIPLE_ERRORS_AND_OTHER_VALUES_SDK_54 as any);
    await jest.runAllTimersAsync();

    expect(terminal.log).toHaveBeenCalledTimes(1);
    expect(stripVTControlCharacters(terminal.log.mock.calls[0].join(''))).toMatchInlineSnapshot(`
" ERROR [Error: Err1][Error: Err2]String

  at App.js:1:1
  at index.js:2:2

  at App2.js:1:1
  at index2.js:2:2

  at App3.js:1:1
  at index3.js:2:2"
`);
  });
});

describe('_getBundleStatusMessage', () => {
  const buildID = '1';
  const reporter = new MetroTerminalReporter('/', {
    log: jest.fn(),
    persistStatus: jest.fn(),
    status: jest.fn(),
    flush: jest.fn(),
  } as any);
  reporter._getElapsedTime = jest.fn(() => BigInt(100));
  reporter._bundleTimers.set(buildID, BigInt(0));

  it(`should format standard progress`, () => {
    expect(
      stripAnsi(
        reporter._getBundleStatusMessage(
          {
            bundleDetails: asBundleDetails({
              entryFile: './index.js',
              platform: 'ios',
              buildID,
            }),
            ratio: 0.5,
            totalFileCount: 100,
            transformedFileCount: 50,
          },
          'in_progress'
        )
      )
    ).toMatchInlineSnapshot(`"iOS ./index.js ▓▓▓▓▓▓▓▓░░░░░░░░ 50.0% ( 50/100)"`);
  });
  it(`should format standard progress for a server invocation`, () => {
    expect(
      stripAnsi(
        reporter._getBundleStatusMessage(
          {
            bundleDetails: asBundleDetails({
              entryFile: './index.js',
              platform: 'ios',
              buildID,
              customTransformOptions: {
                environment: 'node',
              },
            }),
            ratio: 0.5,
            totalFileCount: 100,
            transformedFileCount: 50,
          },
          'in_progress'
        )
      )
    ).toMatchSnapshot();
  });
  it(`should format standard progress for a React Server invocation`, () => {
    const msg = stripAnsi(
      reporter._getBundleStatusMessage(
        {
          bundleDetails: asBundleDetails({
            entryFile: './index.js',
            platform: 'ios',
            buildID,
            customTransformOptions: {
              environment: 'react-server',
            },
          }),
          ratio: 0.5,
          totalFileCount: 100,
          transformedFileCount: 50,
        },
        'in_progress'
      )
    );
    expect(msg).toMatchSnapshot();
    expect(msg).toMatch(/iOS/);
  });
  it(`should format standard progress for a web-based React Server invocation`, () => {
    const msg = stripAnsi(
      reporter._getBundleStatusMessage(
        {
          bundleDetails: asBundleDetails({
            entryFile: './index.js',
            platform: 'web',
            buildID,
            customTransformOptions: {
              environment: 'react-server',
            },
          }),
          ratio: 0.5,
          totalFileCount: 100,
          transformedFileCount: 50,
        },
        'in_progress'
      )
    );
    expect(msg).toMatchSnapshot();
    expect(msg).toMatch(/Web/);
  });

  it(`should format standard progress at 0%`, () => {
    expect(
      stripAnsi(
        reporter._getBundleStatusMessage(
          {
            bundleDetails: asBundleDetails({
              entryFile: './index.js',
              platform: 'android',
              buildID,
            }),
            ratio: 0,
            totalFileCount: 100,
            transformedFileCount: 0,
          },
          'in_progress'
        )
      )
    ).toMatchInlineSnapshot(`"Android ./index.js ░░░░░░░░░░░░░░░░  0.0% (  0/100)"`);
  });
  it(`should format complete loading`, () => {
    expect(
      stripAnsi(
        reporter._getBundleStatusMessage(
          {
            bundleDetails: asBundleDetails({
              entryFile: './index.js',
              platform: 'android',
              buildID,
            }),
            ratio: 1.0,
            totalFileCount: 100,
            transformedFileCount: 100,
          },
          'done'
        )
      )
    ).toMatchInlineSnapshot(`"Android Bundled 0.0ms ./index.js (100 modules)"`);
  });
  it(`should format failed loading`, () => {
    expect(
      stripAnsi(
        reporter._getBundleStatusMessage(
          {
            bundleDetails: asBundleDetails({
              entryFile: './index.js',
              platform: 'android',
              buildID,
            }),
            ratio: 1.0,
            totalFileCount: 100,
            transformedFileCount: 100,
          },
          'failed'
        )
      )
    ).toMatchInlineSnapshot(`"Android Bundling failed 0.0ms ./index.js (100 modules)"`);
  });
});

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
      > 79 | import "path";
           |         ^
        80 |"
    `);
  });
});

describe(isNodeStdLibraryModule, () => {
  it(`returns true for node standard library modules`, () => {
    for (const moduleName of ['node:fs', 'fs/promises', 'net']) {
      expect(isNodeStdLibraryModule(moduleName)).toBe(true);
    }
  });
  it(`returns false for etc modules`, () => {
    for (const moduleName of ['expo', '@expo/config', 'uuid']) {
      expect(isNodeStdLibraryModule(moduleName)).toBe(false);
    }
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
      "You attempted to import the Node standard library module "path" from "App.js".
      It failed because the native React runtime does not include the Node standard library.
      Learn more: https://docs.expo.dev/workflow/using-libraries/#using-third-party-libraries"
    `);
  });
});
