import type { Terminal } from '@expo/metro/metro-core';
import arg = require('arg');
import { stripVTControlCharacters } from 'node:util';

import { stripAnsi } from '../../../../utils/ansi';
import {
  maybeSymbolicateAndFormatJSErrorStackLogAsync,
  parseErrorStringToObject,
} from '../../serverLogLikeMetro';
import {
  extractCodeFrame,
  formatUsingNodeStandardLibraryError,
  isNodeStdLibraryModule,
  MetroTerminalReporter,
  stripMetroInfo,
} from '../MetroTerminalReporter';
import type { BundleDetails } from '../TerminalReporter.types';
import {
  LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_52,
  LOG_ERROR_TEXT_STRINGS_MUST_WRAPPED_SDK_54,
  LOG_MULTIPLE_ERRORS_AND_OTHER_VALUES_SDK_54,
} from './fixtures/terminal-logs';

const asBundleDetails = (value: any) => value as BundleDetails;
const DARK_BLOCK_CHAR = '\u2593';
const LIGHT_BLOCK_CHAR = '\u2591';

jest.useFakeTimers();

const mockIsInteractive = jest.fn(() => false);
jest.mock('../../../../utils/interactive', () => ({
  isInteractive: () => mockIsInteractive(),
}));

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

describe('client log platform prefix and format substitution', () => {
  const terminal = {
    log: jest.fn(),
    persistStatus: jest.fn(),
    status: jest.fn(),
    flush: jest.fn(),
    _update: jest.fn(),
  } satisfies Partial<Terminal>;

  const reporter = new MetroTerminalReporter('/', terminal as any);

  beforeEach(() => {
    terminal.log.mockReset();
  });

  it(`prefixes web client logs with "Web"`, () => {
    reporter._log({
      type: 'client_log',
      level: 'log',
      data: ['hello world'],
      mode: 'web',
    } as any);

    expect(terminal.log).toHaveBeenCalledTimes(1);
    const output = stripVTControlCharacters(terminal.log.mock.calls[0].join(''));
    expect(output).toMatch(/^Web /);
    expect(output).toContain('LOG');
    expect(output).toContain('hello world');
  });

  it(`does not prefix native client logs (NOBRIDGE)`, () => {
    reporter._log({
      type: 'client_log',
      level: 'log',
      data: ['hello world'],
      mode: 'NOBRIDGE',
    } as any);

    expect(terminal.log).toHaveBeenCalledTimes(1);
    const output = stripVTControlCharacters(terminal.log.mock.calls[0].join(''));
    expect(output).not.toMatch(/^(Web|iOS|Android) /);
    expect(output).toContain('LOG');
  });

  it(`does not prefix client logs without mode`, () => {
    reporter._log({
      type: 'client_log',
      level: 'log',
      data: ['hello world'],
    } as any);

    expect(terminal.log).toHaveBeenCalledTimes(1);
    const output = stripVTControlCharacters(terminal.log.mock.calls[0].join(''));
    expect(output).not.toMatch(/^(Web|iOS|Android) /);
  });

  it(`applies printf-style %s format substitution`, () => {
    reporter._log({
      type: 'client_log',
      level: 'warn',
      data: ['%s\n\n%s', 'An error occurred.', 'Visit https://react.dev for more info.'],
      mode: 'web',
    } as any);

    expect(terminal.log).toHaveBeenCalledTimes(1);
    const output = stripVTControlCharacters(terminal.log.mock.calls[0].join(''));
    expect(output).not.toContain('%s');
    expect(output).toContain('An error occurred.');
    expect(output).toContain('Visit https://react.dev for more info.');
  });

  it(`does not apply format substitution when first arg has no specifiers`, () => {
    reporter._log({
      type: 'client_log',
      level: 'log',
      data: ['plain message', 'extra arg'],
    } as any);

    expect(terminal.log).toHaveBeenCalledTimes(1);
    const args = terminal.log.mock.calls[0];
    // Both items should be passed through as separate arguments
    expect(args).toContain('plain message');
    expect(args).toContain('extra arg');
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

describe('non-interactive terminal output', () => {
  /**
   * Reproduces the bug where progress bar status lines interleave with "Bundled" log messages
   * in non-TTY mode. In TTY mode, status lines are overwritten in-place by the Terminal class.
   * In non-TTY mode, Terminal.log() writes immediately while Terminal.status() writes through
   * a 3500ms throttle (#writeStatusThrottled), causing progress bars to appear as permanent
   * output between "Bundled" completion messages:
   *
   *   Web Bundled 2967ms node_modules/expo-router/entry.js (964 modules)
   *   Web node_modules/expo-router/entry.js ▓▓▓░░░░░░░░░░░░░ 21.3% ( 97/210)
   *   Web Bundled 1185ms node_modules/expo-router/entry.js (965 modules)
   */

  const buildID1 = 'build-1';
  const buildID2 = 'build-2';
  const entryFile = 'node_modules/expo-router/entry.js';
  const bundleDetails = asBundleDetails({
    entryFile,
    platform: 'web',
    bundleType: 'bundle',
  });

  function createNonInteractiveReporter() {
    const terminal = {
      log: jest.fn(),
      persistStatus: jest.fn(),
      status: jest.fn(),
      flush: jest.fn(),
    } satisfies Partial<Terminal>;

    const reporter = new MetroTerminalReporter('/', terminal as any);
    reporter._getElapsedTime = jest.fn(() => BigInt(2_967_000_000));
    return { reporter, terminal };
  }

  /**
   * Helper that collects the interleaved order of terminal.log and terminal.status calls.
   * Each entry records the call type and stripped content to make assertions readable.
   */
  function collectOutputOrder(terminal: { log: jest.Mock; status: jest.Mock }) {
    const output: { type: 'log' | 'status'; content: string }[] = [];
    terminal.log.mockImplementation((...args: any[]) => {
      output.push({ type: 'log', content: stripAnsi(args.join(' ')) });
    });
    terminal.status.mockImplementation((...args: any[]) => {
      const content = stripAnsi(args.join(' '));
      if (content) {
        output.push({ type: 'status', content });
      }
    });
    return output;
  }

  it('progress bar status should not interleave with Bundled log messages', () => {
    const { reporter, terminal } = createNonInteractiveReporter();
    const output = collectOutputOrder(terminal);

    // Simulate first bundle: start → progress → done
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID1,
      bundleDetails: { ...bundleDetails, buildID: buildID1 },
      isPrefetch: false,
    } as any);

    // Progress updates (normally throttled at 100ms, we simulate the throttled event directly)
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID1,
      transformedFileCount: 500,
      totalFileCount: 964,
    } as any);

    // First bundle completes
    reporter.update({
      type: 'bundle_build_done',
      buildID: buildID1,
      bundleDetails: { ...bundleDetails, buildID: buildID1 },
    } as any);

    // Second bundle starts immediately (e.g. HMR rebuild)
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID2,
      bundleDetails: { ...bundleDetails, buildID: buildID2 },
      isPrefetch: false,
    } as any);

    // Progress update for second bundle
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID2,
      transformedFileCount: 97,
      totalFileCount: 210,
    } as any);

    // Second bundle completes
    reporter._getElapsedTime = jest.fn(() => BigInt(1_185_000_000));
    reporter.update({
      type: 'bundle_build_done',
      buildID: buildID2,
      bundleDetails: { ...bundleDetails, buildID: buildID2 },
    } as any);

    // Extract only the log calls (what gets permanently written in non-TTY mode)
    const logMessages = output.filter((o) => o.type === 'log');

    // Both "Bundled" messages should appear in the logs
    expect(logMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ content: expect.stringContaining('Bundled') }),
        expect.objectContaining({ content: expect.stringContaining('Bundled') }),
      ])
    );

    // No progress bar should appear in the log output (progress bars belong only in status)
    for (const msg of logMessages) {
      expect(msg.content).not.toContain(DARK_BLOCK_CHAR);
      expect(msg.content).not.toContain(LIGHT_BLOCK_CHAR);
    }

    // Now check the status calls: in non-TTY mode, these become permanent output.
    // After a bundle completes, the status should not contain progress bars for completed bundles.
    const statusMessages = output.filter((o) => o.type === 'status');

    // Find the status call that happens right after the first "Bundled" log
    const firstBundledIndex = output.findIndex(
      (o) => o.type === 'log' && o.content.includes('Bundled')
    );
    const statusAfterFirstBundled = output
      .slice(firstBundledIndex + 1)
      .filter((o) => o.type === 'status');

    // The status after the first "Bundled" should not contain a progress bar for the completed bundle
    for (const msg of statusAfterFirstBundled) {
      // If there's a progress bar, it should only be for bundle 2 (not stale data from bundle 1)
      if (msg.content.includes(DARK_BLOCK_CHAR) || msg.content.includes(LIGHT_BLOCK_CHAR)) {
        // This is the bug: a progress bar status appears in the output stream
        // between the two "Bundled" messages, which in non-TTY mode is permanent output.
        // The status should be empty or suppressed in non-interactive mode.
        expect(msg.content).not.toContain(DARK_BLOCK_CHAR);
      }
    }
  });

  it('_getStatusMessage returns empty string in non-interactive mode', () => {
    const { reporter } = createNonInteractiveReporter();

    // Start a bundle so there's an active bundle
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID1,
      bundleDetails: { ...bundleDetails, buildID: buildID1 },
      isPrefetch: false,
    } as any);

    // Add some progress
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID1,
      transformedFileCount: 50,
      totalFileCount: 100,
    } as any);

    // In non-interactive mode, _getStatusMessage() should return empty
    // since status lines can't be overwritten and would produce permanent noise.
    expect(reporter._getStatusMessage()).toBe('');
  });
});

describe('status cleared before log lines', () => {
  beforeEach(() => mockIsInteractive.mockReturnValue(true));
  afterEach(() => mockIsInteractive.mockReturnValue(false));

  /**
   * Metro's Terminal.#update() is async and snapshots #nextStatusStr when it starts.
   * When _log() calls terminal.log(), Terminal starts #update() which captures
   * whatever status is currently set. If it's a progress bar, that progress bar
   * gets written as permanent output between log lines (it can't be reliably
   * cleared before more output arrives).
   *
   * The fix: update() clears the status to empty before _log() runs, so Terminal's
   * #update() captures an empty status and writes no progress bars alongside log lines.
   */

  const buildID1 = 'build-1';
  const buildID2 = 'build-2';
  const entryFile = 'node_modules/expo-router/entry.js';
  const serverEntry = 'packages/@expo/router-server/node/render.js';
  const webDetails = asBundleDetails({
    entryFile,
    platform: 'web',
    bundleType: 'bundle',
  });
  const serverDetails = asBundleDetails({
    entryFile: serverEntry,
    platform: 'web',
    bundleType: 'bundle',
    customTransformOptions: { environment: 'node' },
  });

  function createReporter() {
    const callOrder: { type: 'log' | 'status'; content: string }[] = [];

    const terminal = {
      log: jest.fn((...args: any[]) => {
        const content = stripAnsi(args.join(' '));
        callOrder.push({ type: 'log', content });
      }),
      persistStatus: jest.fn(),
      status: jest.fn((...args: any[]) => {
        const content = stripAnsi(args.join(' '));
        callOrder.push({ type: 'status', content });
      }),
      flush: jest.fn(),
    } satisfies Partial<Terminal>;

    const reporter = new MetroTerminalReporter('/', terminal as any);
    reporter._getElapsedTime = jest.fn(() => BigInt(100_000_000));
    return { reporter, terminal, callOrder };
  }

  it('clears status before any log call during bundle_build_done', () => {
    const { reporter, callOrder } = createReporter();

    // Start a bundle and add progress
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID1,
      bundleDetails: { ...webDetails, buildID: buildID1 },
      isPrefetch: false,
    } as any);
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID1,
      transformedFileCount: 50,
      totalFileCount: 100,
    } as any);

    callOrder.length = 0;

    // Bundle completes
    reporter.update({
      type: 'bundle_build_done',
      buildID: buildID1,
      bundleDetails: { ...webDetails, buildID: buildID1 },
    } as any);

    // The FIRST call should be status('') to clear progress bars
    expect(callOrder[0]).toEqual({ type: 'status', content: '' });

    // The log should come after the clear
    const bundledLog = callOrder.find((c) => c.type === 'log' && c.content.includes('Bundled'));
    expect(bundledLog).toBeDefined();
  });

  it('clears status before server log warnings', () => {
    const { reporter, callOrder } = createReporter();

    // Start a bundle (web) and add progress
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID1,
      bundleDetails: { ...webDetails, buildID: buildID1 },
      isPrefetch: false,
    } as any);
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID1,
      transformedFileCount: 883,
      totalFileCount: 886,
    } as any);

    callOrder.length = 0;

    // A server log (WARN) comes in while web bundle is still active
    reporter.update({
      type: 'unstable_server_log',
      level: 'warn',
      data: ['Deep imports from react-native are deprecated'],
    } as any);

    // The FIRST call should be status('') to clear the web progress bar
    expect(callOrder[0]).toEqual({ type: 'status', content: '' });

    // Status should be restored at the end (web bundle still active)
    const lastStatus = [...callOrder].reverse().find((c) => c.type === 'status');
    expect(lastStatus?.content).toContain(entryFile);
  });

  it('does not clear status for progress events', () => {
    const { reporter, callOrder } = createReporter();

    // Start a bundle
    reporter.update({
      type: 'bundle_build_started',
      buildID: buildID1,
      bundleDetails: { ...webDetails, buildID: buildID1 },
      isPrefetch: false,
    } as any);

    callOrder.length = 0;

    // Progress event should NOT clear the status
    reporter.update({
      type: 'bundle_transform_progressed_throttled',
      buildID: buildID1,
      transformedFileCount: 50,
      totalFileCount: 100,
    } as any);

    // Should not start with a clear
    const firstStatus = callOrder.find((c) => c.type === 'status');
    expect(firstStatus?.content).not.toBe('');
  });
});

describe('extractCodeFrame', () => {
  it('extracts code frame from a message', () => {
    const inputMessage = `
Metro error: Unable to resolve module @expo/ui/swift-ui-primitives from /Users/krystofwoldrich/repos/krystofwoldrich/ev-charging-map/app/(tabs)/index.tsx: @expo/ui/swift-ui-primitives could not be found within the project or in these directories:
  node_modules
  33 |
  34 |
> 35 | import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui-primitives";
     |                                                                              ^
  36 | // import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui";
  37 | import {
  38 |   cornerRadius,
    `;

    const expectedCodeFrame = `  33 |
  34 |
> 35 | import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui-primitives";
     |                                                                              ^
  36 | // import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui";
  37 | import {
  38 |   cornerRadius,`;

    const actualCodeFrame = extractCodeFrame(inputMessage);
    expect(actualCodeFrame).toBe(expectedCodeFrame);
  });

  it('extracts code frame with ANSI codes', () => {
    const inputMessage = `
Unable to resolve module @expo/ui/swift-ui-primitives from /Users/krystofwoldrich/repos/krystofwoldrich/ev-charging-map/app/(tabs)/index.tsx: @expo/ui/swift-ui-primitives could not be found within the project or in these directories:
  node_modules
\x1b[0m \x1b[90m 33 |\x1b[39m
\x1b[90m 34 |\x1b[39m
\x1b[31m\x1b[1m>\x1b[22m\x1b[39m\x1b[90m 35 |\x1b[39m \x1b[36mimport\x1b[39m { \x1b[33mButton\x1b[39m\x1b[33m,\x1b[39m \x1b[33mContextMenu\x1b[39m\x1b[33m,\x1b[39m \x1b[33mHost\x1b[39m\x1b[33m,\x1b[39m \x1b[33mHStack\x1b[39m\x1b[33m,\x1b[39m \x1b[33mImage\x1b[39m\x1b[33m,\x1b[39m \x1b[33mTextField\x1b[39m\x1b[33m,\x1b[39m \x1b[33mVStack\x1b[39m } \x1b[36mfrom\x1b[39m \x1b[32m"@expo/ui/swift-ui-primitives"\x1b[39m\x1b[33m;\x1b[39m
\x1b[90m    |\x1b[39m                                                                              \x1b[31m\x1b[1m^\x1b[22m\x1b[39m
\x1b[90m 36 |\x1b[39m \x1b[90m// import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui";\x1b[39m
\x1b[90m 37 |\x1b[39m \x1b[36mimport\x1b[39m {
\x1b[90m 38 |\x1b[39m   cornerRadius\x1b[33m,\x1b[39m\x1b[0m
    `.trim();

    const expectedCodeFrame = `\x1b[0m \x1b[90m 33 |\x1b[39m
\x1b[90m 34 |\x1b[39m
\x1b[31m\x1b[1m>\x1b[22m\x1b[39m\x1b[90m 35 |\x1b[39m \x1b[36mimport\x1b[39m { \x1b[33mButton\x1b[39m\x1b[33m,\x1b[39m \x1b[33mContextMenu\x1b[39m\x1b[33m,\x1b[39m \x1b[33mHost\x1b[39m\x1b[33m,\x1b[39m \x1b[33mHStack\x1b[39m\x1b[33m,\x1b[39m \x1b[33mImage\x1b[39m\x1b[33m,\x1b[39m \x1b[33mTextField\x1b[39m\x1b[33m,\x1b[39m \x1b[33mVStack\x1b[39m } \x1b[36mfrom\x1b[39m \x1b[32m"@expo/ui/swift-ui-primitives"\x1b[39m\x1b[33m;\x1b[39m
\x1b[90m    |\x1b[39m                                                                              \x1b[31m\x1b[1m^\x1b[22m\x1b[39m
\x1b[90m 36 |\x1b[39m \x1b[90m// import { Button, ContextMenu, Host, HStack, Image, TextField, VStack } from "@expo/ui/swift-ui";\x1b[39m
\x1b[90m 37 |\x1b[39m \x1b[36mimport\x1b[39m {
\x1b[90m 38 |\x1b[39m   cornerRadius\x1b[33m,\x1b[39m\x1b[0m`;

    const actualCodeFrame = extractCodeFrame(inputMessage);
    expect(actualCodeFrame).toBe(expectedCodeFrame);
  });

  it('returns empty string when no code frame is found', () => {
    const inputMessage = `This is a test message without a code frame.`;
    const actualCodeFrame = extractCodeFrame(inputMessage);
    expect(actualCodeFrame).toBeFalsy();
  });

  it('returns empty string for code frame look alike', () => {
    const inputMessage = `This is a test error message 37 | import {`;
    const actualCodeFrame = extractCodeFrame(inputMessage);
    expect(actualCodeFrame).toBeFalsy();
  });

  it('returns only the first code frame when multiple are present', () => {
    const inputMessage = `
This is error with multiple code frames.
  34 |
> 35 | const a = 1;
     |       ^
  36 | // comment

Caused by: Another message
  78 |
> 79 | const b = 2;
     |       ^
  80 | // another comment
    `;

    const expectedCodeFrame = `  34 |
> 35 | const a = 1;
     |       ^
  36 | // comment`;

    const actualCodeFrame = extractCodeFrame(inputMessage);
    expect(actualCodeFrame).toBe(expectedCodeFrame);
  });
});
