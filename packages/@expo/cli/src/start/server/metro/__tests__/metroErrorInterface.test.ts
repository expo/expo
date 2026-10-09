import { events } from '2g';
import resolveFrom from 'resolve-from';

import { Log } from '../../../../log';
import * as interactive from '../../../../utils/interactive';
import { MetroTerminalReporter } from '../MetroTerminalReporter';
import { LogBoxLog } from '../log-box/LogBoxLog';
import {
  attachImportStackToRootMessage,
  nearestImportStack,
  likelyContainsCodeFrame,
  dropStackIfContainsCodeFrame,
  logMetroError,
  logMetroErrorAsync,
  logMetroErrorWithStack,
  getErrorOverlayHtmlAsync,
  HAS_LOGGED_SYMBOL,
} from '../metroErrorInterface';

jest.mock('../../../../log');
jest.mock('../../getStaticRenderFunctions', () => ({
  createMetroEndpointAsync: jest.fn().mockResolvedValue('/_expo/error.bundle'),
}));
jest.mock('2g', () => {
  const actual = jest.requireActual('2g');
  const event = Object.assign(jest.fn(), actual.events('metro'));
  return { ...actual, events: Object.assign(() => event, actual.events) };
});
jest.mock('../log-box/LogBoxLog', () => ({
  LogBoxLog: jest.fn(() => ({
    symbolicate: (_type: string, callback: () => void) => callback(),
  })),
}));

interface ErrorWithImportStack extends Error {
  _expoImportStack?: string;
  cause?: ErrorWithImportStack;
}

// `new Error()` is typed as `Error` (whose `cause` is `unknown`), so build the
// loosely-typed test errors through a helper that yields an `ErrorWithImportStack`.
function makeError(message: string): ErrorWithImportStack {
  return new Error(message) as ErrorWithImportStack;
}

describe('attachImportStackToRootMessage', () => {
  it('no change to error', () => {
    const actual = new Error('Test error');
    attachImportStackToRootMessage(actual);

    expect(actual).toEqual(new Error('Test error'));
    expect(actual.stack).toBeDefined();
  });

  it('import from root', () => {
    const actual = makeError('Test error');
    actual._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.stack).toBeUndefined();
  });

  it('import from root', () => {
    const actual = makeError('Test error');
    actual._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from direct cause', () => {
    const actual = makeError('Test error');
    actual.cause = new Error('Direct cause') as ErrorWithImportStack;
    actual.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from cause chain', () => {
    const actual = makeError('Test error');
    actual.cause = new Error('Direct cause') as ErrorWithImportStack;
    actual.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    actual.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('import from nearest cause in chain', () => {
    const actual = makeError('Test error');
    actual.cause = new Error('Direct cause') as ErrorWithImportStack;
    actual.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    actual.cause.cause.cause = new Error('Another indirect cause') as ErrorWithImportStack;
    actual.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;
    actual.cause.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useApples.ts
        | import "not-existing-module-2"`;
    attachImportStackToRootMessage(actual);

    expect(actual.message).toEqual(`Test error


      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });
});

describe('nearestImportStack', () => {
  it('returns undefined for non-error', () => {
    expect(nearestImportStack('not an error')).toBeUndefined();
  });

  it('returns undefined when no import stack exists', () => {
    expect(nearestImportStack(new Error('Test error'))).toBeUndefined();
  });

  it('returns import stack from root error', () => {
    const error = makeError('Test error');
    error._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from direct cause', () => {
    const error = makeError('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from deeper in cause chain', () => {
    const error = makeError('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    error.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });

  it('returns import stack from nearest cause in chain', () => {
    const error = makeError('Test error');
    error.cause = new Error('Direct cause') as ErrorWithImportStack;
    error.cause.cause = new Error('Indirect cause') as ErrorWithImportStack;
    error.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`;

    // Add another cause with an import stack that should be ignored
    error.cause.cause.cause = new Error('Another indirect cause') as ErrorWithImportStack;
    error.cause.cause.cause._expoImportStack = `
      Import stack:
        hooks/hooks/useApples.ts
        | import "not-existing-module-2"`;

    expect(nearestImportStack(error)).toEqual(`
      Import stack:
        hooks/hooks/useBananas.ts
        | import "not-existing-module"`);
  });
});

describe('likelyContainsCodeFrame', () => {
  it('returns false for undefined', () => {
    expect(likelyContainsCodeFrame(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(likelyContainsCodeFrame('')).toBe(false);
  });

  it('returns false for non-code frame message', () => {
    expect(likelyContainsCodeFrame('This is a regular error message')).toBe(false);
  });

  it('returns true for code frame message', () => {
    expect(
      likelyContainsCodeFrame(`
SyntaxError: hooks/useBananas.ts: Unexpected token (3:9)

  2 | import { FruitLabelPrefix } from './useFruit';
> 3 | import { [] } from './useFruit';
    |          ^
  4 |
  5 | export function useBananas() {
    `)
    ).toBe(true);
  });

  it('returns true for code frame with ANSI colors', () => {
    expect(
      likelyContainsCodeFrame(`
\x1b[31mSyntaxError: hooks/useBananas.ts: Unexpected token (3:9)\x1b[0m

\x1b[90m  2 |\x1b[0m import { FruitLabelPrefix } from './useFruit';
\x1b[31m> 3 |\x1b[0m import { [] } from './useFruit';
\x1b[31m    |\x1b[0m          \x1b[31m^\x1b[0m
\x1b[90m  4 |\x1b[0m
\x1b[90m  5 |\x1b[0m export function useBananas() {
      `)
    ).toBe(true);
  });
});

describe('dropStackIfContainsCodeFrame', () => {
  it('keeps stack if no code frame', () => {
    const error = new Error('This is a regular error message');
    const originalStack = error.stack;
    dropStackIfContainsCodeFrame(error);
    expect(error.stack).toEqual(originalStack);
  });

  it('drops stack if code frame is present', () => {
    const error = new Error(`
\x1b[31mSyntaxError: hooks/useBananas.ts: Unexpected token (3:9)\x1b[0m

\x1b[90m  2 |\x1b[0m import { FruitLabelPrefix } from './useFruit';
\x1b[31m> 3 |\x1b[0m import { [] } from './useFruit';
\x1b[31m    |\x1b[0m          \x1b[31m^\x1b[0m
\x1b[90m  4 |\x1b[0m
\x1b[90m  5 |\x1b[0m export function useBananas() {
      `);
    dropStackIfContainsCodeFrame(error);
    expect(error.stack).toBeUndefined();
  });
});

describe('logMetroError', () => {
  it.each([
    ['bundle', true],
    ['bundle', false],
    ['map', true],
    ['map', false],
  ] as const)('preserves %s lifecycle events with interactive=%s', (bundleType, isInteractive) => {
    const event = events('metro');
    const span = jest.spyOn(event, 'span').mockReturnValue(event);
    const terminalMode = jest.spyOn(interactive, 'isInteractive').mockReturnValue(isInteractive);
    const reporter = new MetroTerminalReporter('/app', {
      log: jest.fn(),
      status: jest.fn(),
      persistStatus: jest.fn(),
    } as any);
    const error = Object.assign(new Error('bundle failed'), { [HAS_LOGGED_SYMBOL]: true });
    const start = (buildID: string) =>
      reporter.update({
        type: 'bundle_build_started',
        buildID,
        bundleDetails: {
          entryFile: '/app/index.js',
          platform: 'web',
          bundleType,
          dev: true,
          minify: false,
          customResolverOptions: {},
          customTransformOptions: {},
        },
        isPrefetch: false,
      });
    try {
      start('first');
      start('second');
      reporter.update({
        type: 'bundle_transform_progressed_throttled',
        buildID: 'second',
        transformedFileCount: 2,
        totalFileCount: 5,
      });
      reporter.update({ type: 'bundle_build_failed', buildID: 'first' });
      reporter.update({ type: 'bundling_error', error });
      reporter.update({ type: 'bundle_build_done', buildID: 'second' });
      reporter.update({ type: 'bundle_build_done', buildID: 'second' });
      start('third');
      reporter.update({ type: 'bundle_build_failed', buildID: 'third' });
      reporter.update({ type: 'bundling_error', error });

      expect(
        jest.mocked(event).mock.calls.map(([name, data]) => [name, 'id' in data && data.id])
      ).toEqual([
        ['bundling:start', 'first'],
        ['bundling:start', 'second'],
        ['bundling:progress', 'second'],
        ['bundling:failed', 'first'],
        ['bundling:done', 'second'],
        ['bundling:start', 'third'],
        ['bundling:failed', 'third'],
      ]);
      expect(event).toHaveBeenCalledWith(
        'bundling:done',
        expect.objectContaining({ id: 'second', total: 5 })
      );
    } finally {
      span.mockRestore();
      terminalMode.mockRestore();
    }
  });

  it.each([{}, { targetModuleName: 'fs', originModulePath: '/app/index.js' }])(
    'does not repeat a reported bundling error: %j',
    async (details) => {
      const error = Object.assign(new Error('bundle failed'), details);
      const terminal = { log: jest.fn() };
      const reporter = new MetroTerminalReporter('/app', terminal as any);
      reporter._logBundlingError(error);
      await logMetroError('/app', { error });
      await logMetroErrorWithStack('/app', { error, stack: [] });
      expect(events('metro')).toHaveBeenCalledTimes(1);
      expect(events('metro')).toHaveBeenCalledWith('bundling:failed', expect.any(Object));
      expect(terminal.log).toHaveBeenCalledTimes(1);
      expect(Log.log).not.toHaveBeenCalled();
      expect(LogBoxLog).not.toHaveBeenCalled();
    }
  );

  it('does not repeat a formatted error but still generates its overlay', async () => {
    jest.mocked(resolveFrom).mockReturnValueOnce('/app/node_modules/expo-router/_error.js');
    const error = new Error('render failed');
    await logMetroErrorWithStack('/app', { error, stack: [] });
    await logMetroErrorAsync({ projectRoot: '/app', error });
    const html = await getErrorOverlayHtmlAsync({ projectRoot: '/app', routerRoot: 'app', error });
    expect(events('metro')).toHaveBeenCalledTimes(1);
    expect(Log.log).toHaveBeenCalledTimes(4);
    expect(html).toContain('_expo-static-error');
    expect(html).toContain('/_expo/error.bundle');
  });

  it('symbolicates server bundle frames inside node_modules', async () => {
    const error = new Error('fake-lib: failed during module init');
    error.stack = [
      'Error: fake-lib: failed during module init',
      '    at initializeLibrary (/app/node_modules/@expo/router-server/node/render.js.bundle?platform=web&dev=true:128083:11)',
    ].join('\n');

    await logMetroError('/app', { error });

    expect(LogBoxLog).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: [expect.objectContaining({ methodName: 'initializeLibrary', lineNumber: 128083 })],
      })
    );
  });
});
