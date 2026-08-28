import { vol } from 'memfs';

import { EXIT_OUTCOME_FAILED } from '../../exitCodes';
import {
  CdpClient,
  CdpPromisePendingError,
  CdpRequestError,
  RPC_METHOD_NOT_FOUND,
} from '../cdpClient';
import { runtimeErrorsAsync, runtimeEvalAsync } from '../runtimeAsync';
import { CdpRuntimeErrorCollector } from '../runtimeErrorCollector';
import { UNTRUSTED_OUTPUT_BEGIN } from '../untrusted';

// The real error class and the real code are kept: the command branches on both.
jest.mock('../cdpClient', () => ({
  ...jest.requireActual('../cdpClient'),
  CdpClient: jest.fn(),
}));
jest.mock('../runtimeErrorCollector', () => ({ CdpRuntimeErrorCollector: jest.fn() }));

const devServerUrl = 'http://127.0.0.1:8081';

const TARGET = { id: '1', appId: 'host.exp.Exponent', webSocketDebuggerUrl: 'ws://debugger' };

/** Answer `GET /json/list` with the given targets, or make the dev server unreachable. */
function mockDevServer(targets: unknown[] | null) {
  globalThis.fetch = (async () => {
    if (targets == null) {
      throw new Error('fetch failed');
    }
    return { ok: true, json: async () => targets };
  }) as unknown as typeof fetch;
}

function mockEvaluate(implementation: () => Promise<any>) {
  const evaluateAsync = jest.fn(implementation);
  jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync }) as any);
  return evaluateAsync;
}

function mockCollect(implementation: () => Promise<any>) {
  const collectAsync = jest.fn(implementation);
  jest.mocked(CdpRuntimeErrorCollector).mockImplementation(() => ({ collectAsync }) as any);
  return collectAsync;
}

function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockDevServer([TARGET]);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

const evalOptions = {
  action: 'eval' as const,
  expression: 'globalThis.count',
  devServerUrl,
  timeoutMs: 5000,
  awaitPromise: true,
  json: false,
};

describe(runtimeEvalAsync, () => {
  it(`should print the value fenced as untrusted and exit successfully`, async () => {
    const evaluateAsync = mockEvaluate(async () => ({ value: 3, type: 'number' }));

    await expect(runtimeEvalAsync(evalOptions)).resolves.toBe(0);

    expect(CdpClient).toHaveBeenCalledWith({ metroUrl: devServerUrl });
    expect(evaluateAsync).toHaveBeenCalledWith('globalThis.count', {
      awaitPromise: true,
      timeoutMs: 5000,
    });
    expect(printed()).toContain(UNTRUSTED_OUTPUT_BEGIN);
    expect(printed()).toContain('Result type: number');
  });

  it(`should exit with 1 when the expression throws inside the app`, async () => {
    mockEvaluate(async () => ({ exceptionText: 'TypeError: boom' }));

    await expect(runtimeEvalAsync(evalOptions)).resolves.toBe(1);
    expect(printed()).toContain('threw an exception');
  });

  it(`should print the machine shape with --json`, async () => {
    mockEvaluate(async () => ({ value: { id: 7 }, type: 'object' }));

    await runtimeEvalAsync({ ...evalOptions, json: true });

    // The object is the whole of stdout: nothing is added for a human to read.
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(printed())).toEqual({
      devServerUrl,
      expression: 'globalThis.count',
      threw: false,
      type: 'object',
      value: { id: 7 },
      description: null,
      exception: null,
      promise: null,
      untrusted: ['value', 'description', 'exception', 'promise'],
    });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  // A result and an exception share one stable key set; the keys whose facts are
  // describe the run itself are in both.
  it(`should print a stable set of top-level keys with --json for a returned value`, async () => {
    mockEvaluate(async () => ({ value: { id: 7 }, type: 'object', description: 'Object' }));

    await runtimeEvalAsync({ ...evalOptions, json: true });

    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'description',
      'devServerUrl',
      'exception',
      'expression',
      'promise',
      'threw',
      'type',
      'untrusted',
      'value',
    ]);
  });

  it(`should print a stable set of top-level keys with --json for an exception`, async () => {
    mockEvaluate(async () => ({ exceptionText: 'TypeError: boom', exceptionStack: 'at <anon>' }));

    await expect(runtimeEvalAsync({ ...evalOptions, json: true })).resolves.toBe(1);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'description',
      'devServerUrl',
      'exception',
      'expression',
      'promise',
      'threw',
      'type',
      'untrusted',
      'value',
    ]);
  });

  it(`should explain how to start a dev server when none answers`, async () => {
    mockDevServer(null);
    const evaluateAsync = mockEvaluate(async () => ({ value: 1 }));

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(error.message).toContain('npx @expo/agent-cli dev --detach');
    expect(evaluateAsync).not.toHaveBeenCalled();
  });

  it(`should explain how to connect an app when the dev server has no target`, async () => {
    mockDevServer([]);
    mockEvaluate(async () => ({ value: 1 }));

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
  });

  // Expo Go for Android has no CDP debugger, so this is not a transient failure: no retry and no
  // longer timeout will make it work, and the message must not promise a reading command works.
  it(`should report an unsupported evaluate instead of a failed one`, async () => {
    mockEvaluate(async () => {
      throw new CdpRequestError('The app rejected the evaluate request', RPC_METHOD_NOT_FOUND);
    });

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_EVALUATE_UNSUPPORTED');
    expect(error.message).toContain('Expo Go for Android');
    expect(error.message).toContain('reports an empty window');
    // @ref ../runtimeAsync — friction run 6, F55. `dev --plan` prints the Expo Go path for a
    // project Expo Go can serve, so it must not be offered as the way to see a development build.
    expect(error.message).not.toContain('"npx @expo/agent-cli dev" prints the plan');
    expect(error.message).not.toMatch(/--timeout/);
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli runtime:errors --android');
  });

  // F21: a rejected promise is the asynchronous form of a throw, so an agent gating on the exit
  // code must not read a failed `fetch` as a pass — but the two are different facts in the report.
  it(`should exit with 1 when the promise the expression returned rejects`, async () => {
    mockEvaluate(async () => ({
      promise: {
        state: 'rejected',
        awaited: true,
        waitedMs: 12,
        reason: { text: 'Error: BOOM_REJECT', stack: '  at anonymous' },
      },
    }));

    await expect(runtimeEvalAsync({ ...evalOptions, json: true })).resolves.toBe(1);

    const report = JSON.parse(printed());
    expect(report.threw).toBe(false);
    expect(report.exception).toBeNull();
    expect(report.promise).toMatchObject({ state: 'rejected' });
  });

  it(`should exit with 0 for a promise that resolved, and report its value`, async () => {
    mockEvaluate(async () => ({
      value: 200,
      type: 'number',
      promise: { state: 'fulfilled', awaited: true, waitedMs: 132 },
    }));

    await expect(runtimeEvalAsync(evalOptions)).resolves.toBe(0);
    expect(printed()).toContain('returned a promise, and it resolved in 132ms');
    expect(printed()).toContain('Settled type: number');
  });

  it(`should say that --no-await-promise is why there is no settled value`, async () => {
    mockEvaluate(async () => ({ type: 'promise', promise: { state: 'pending', awaited: false } }));

    await expect(runtimeEvalAsync({ ...evalOptions, awaitPromise: false })).resolves.toBe(0);
    expect(printed()).toContain('--no-await-promise');
    // Never the polyfill's internals, which is what the flag used to print.
    expect(printed()).not.toContain('_A');
  });

  // A promise the wait ran out on is not a value, so it is not reported as one.
  it(`should report a promise that outlived the wait as its own failure`, async () => {
    mockEvaluate(async () => {
      throw new CdpPromisePendingError(5000);
    });

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_PROMISE_PENDING');
    expect(error.message).toContain('had not settled after 5000ms');
    expect(error.message).toContain('--timeout');
    expect(error.message).toContain('--no-await-promise');
  });

  it(`should say that a reload lost the outcome, not that the promise is slow`, async () => {
    mockEvaluate(async () => {
      throw new CdpPromisePendingError(120, true);
    });

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_PROMISE_PENDING');
    expect(error.message).toContain('the app reloaded');
    expect(error.message).not.toContain('--timeout');
  });

  it(`should report a failed evaluate request with the reason and a next step`, async () => {
    mockEvaluate(async () => {
      throw new Error('The app did not answer the evaluate request within 5000ms.');
    });

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_EVALUATE_FAILED');
    expect(error.message).toContain('did not answer the evaluate request');
    expect(error.message).toContain('--timeout');
  });
});

const errorsOptions = {
  action: 'errors' as const,
  devServerUrl,
  durationMs: 2000,
  json: false,
  followups: true,
  failOnError: false,
};

describe(runtimeErrorsAsync, () => {
  it(`should report an empty window without an untrusted fence`, async () => {
    mockCollect(async () => []);

    await expect(runtimeErrorsAsync(errorsOptions)).resolves.toBe(0);

    expect(CdpRuntimeErrorCollector).toHaveBeenCalledWith({
      metroUrl: devServerUrl,
      durationMs: 2000,
      // The reconnect grace period, so the command the CLI names straight after a reload does not
      // read the app's brief invisibility as "there is no app" (friction run 4, F39).
      targetRetryMs: 3000,
    });
    expect(printed()).toContain('No runtime errors were reported');
    expect(printed()).not.toContain(UNTRUSTED_OUTPUT_BEGIN);
  });

  it(`should print the collected errors and still exit successfully`, async () => {
    mockCollect(async () => [
      { source: 'console', timestamp: 1700000000001, message: 'Request failed' },
    ]);

    await expect(runtimeErrorsAsync(errorsOptions)).resolves.toBe(0);
    expect(printed()).toContain('Collected 1 runtime error(s)');
    expect(printed()).toContain(UNTRUSTED_OUTPUT_BEGIN);
  });

  // F25: `dev:wait` exits 20 on a bundle that does not build while this exited 0 with the app
  // throwing, so an agent could gate on one and not the other. Opt-in, both ways round.
  describe('--fail-on-error', () => {
    it(`should exit 20 when the window caught something`, async () => {
      mockCollect(async () => [
        { source: 'console', timestamp: 1700000000001, message: 'Request failed' },
      ]);

      await expect(
        runtimeErrorsAsync({ ...errorsOptions, failOnError: true })
      ).resolves.toBe(EXIT_OUTCOME_FAILED);
    });

    it(`should exit 0 for an empty window even when it is a gate`, async () => {
      mockCollect(async () => []);

      await expect(runtimeErrorsAsync({ ...errorsOptions, failOnError: true })).resolves.toBe(0);
    });
  });

  describe('symbolication', () => {
    const BUNDLE_URL = 'http://127.0.0.1:8081/index.bundle//&platform=ios&dev=true';

    /** Answer `/symbolicate` with `stack`, and `/json/list` with the connected app. */
    function mockSymbolicator(stack: unknown[] | null) {
      globalThis.fetch = (async (url: string) => {
        if (String(url).endsWith('/symbolicate')) {
          return stack == null
            ? { ok: false, status: 500, json: async () => ({}) }
            : { ok: true, status: 200, json: async () => ({ stack, codeFrame: null }) };
        }
        return { ok: true, json: async () => [TARGET] };
      }) as unknown as typeof fetch;
    }

    const thrown = {
      source: 'exception' as const,
      timestamp: 1700000000000,
      message: 'Error: BOOM',
      stack: `  at render (${BUNDLE_URL}:49572:40)`,
      frames: [{ methodName: 'render', file: BUNDLE_URL, lineNumber: 49572, column: 39 }],
    };

    it(`should report the project file and line instead of a bundle offset`, async () => {
      mockCollect(async () => [thrown]);
      mockSymbolicator([
        {
          file: '/project/src/app/index.tsx',
          lineNumber: 42,
          column: 12,
          methodName: 'Index',
          collapse: false,
        },
      ]);

      await runtimeErrorsAsync({ ...errorsOptions, json: true }, { projectRoot: '/project' });

      const report = JSON.parse(printed());
      expect(report.errors[0].stack).toBe('  at Index (src/app/index.tsx:42:13)');
      expect(report.errors[0].symbolicated).toBe(true);
      expect(report.errors[0].frames).toEqual([
        {
          methodName: 'Index',
          file: 'src/app/index.tsx',
          lineNumber: 42,
          column: 12,
          collapse: false,
        },
      ]);
    });

    // Roughly 2 KB of repeated transform options per error, and no project file anywhere.
    it(`should trim the query string of a frame it could not map`, async () => {
      mockCollect(async () => [thrown]);
      mockSymbolicator([{ file: BUNDLE_URL, lineNumber: null, column: null, collapse: true }]);

      await runtimeErrorsAsync({ ...errorsOptions, json: true }, { projectRoot: '/project' });

      const report = JSON.parse(printed());
      expect(report.errors[0].stack).toBe(
        '  at render (http://127.0.0.1:8081/index.bundle:49572:40)'
      );
      expect(report.errors[0].symbolicated).toBe(false);
      expect(report.errors[0].stack).not.toContain('platform=ios');
    });

    it(`should keep the raw frame when the dev server cannot symbolicate`, async () => {
      mockCollect(async () => [thrown]);
      mockSymbolicator(null);

      await expect(
        runtimeErrorsAsync({ ...errorsOptions, json: true }, { projectRoot: '/project' })
      ).resolves.toBe(0);

      const report = JSON.parse(printed());
      expect(report.errors[0].symbolicated).toBe(false);
      expect(report.errors[0].stack).toContain('49572');
    });
  });

  it(`should print the machine shape with --json`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync({ ...errorsOptions, json: true });

    // The object is the whole of stdout: the note about the collection window is text-mode only.
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(printed()).not.toContain(UNTRUSTED_OUTPUT_BEGIN);
    expect(JSON.parse(printed())).toEqual({
      devServerUrl,
      durationMs: 2000,
      count: 0,
      errors: [],
      runtimeReadable: null,
      runtimeEvidence: null,
      devServerLog: {
        read: false,
        logFile: null,
        count: 0,
        older: 0,
        reason: 'the runtime answered the debugger, so the dev server log was not needed',
        otherPlatformsConnected: [],
      },
      untrusted: ['errors'],
      followups: [
        {
          id: 'runtime-errors-reproduce',
          command: 'npx @expo/agent-cli runtime:errors --duration 4000',
          why: expect.stringContaining('reproduce'),
        },
        {
          id: 'runtime-errors-typecheck',
          command: 'npx @expo/agent-cli typecheck',
          why: expect.stringContaining('not a healthy app'),
        },
      ],
    });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    mockCollect(async () => [
      { source: 'exception', timestamp: 1700000000001, message: 'boom', stack: 'at <anon>' },
    ]);

    await runtimeErrorsAsync({ ...errorsOptions, json: true });

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'count',
      'devServerLog',
      'devServerUrl',
      'durationMs',
      'errors',
      'followups',
      'runtimeEvidence',
      'runtimeReadable',
      'untrusted',
    ]);
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — the runtime loop.
  it(`should ask for a rerun after the reported errors are fixed`, async () => {
    mockCollect(async () => [{ source: 'console', timestamp: 1, message: 'Request failed' }]);

    await runtimeErrorsAsync(errorsOptions);

    expect(printed()).toContain('Suggested next:');
    expect(printed()).toContain('npx @expo/agent-cli runtime:errors --duration 2000');
  });

  it(`should ask for a longer window when nothing was reported`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync(errorsOptions);

    expect(printed()).toContain('npx @expo/agent-cli runtime:errors --duration 4000');
  });

  it(`should print no Next section with --no-followups`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync({ ...errorsOptions, followups: false });

    expect(printed()).not.toContain('Suggested next:');
  });

  it(`should embed an empty follow-up list in --json with --no-followups`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync({ ...errorsOptions, json: true, followups: false });

    // The key stays in the set either way, so a parser reads one shape (llp/0006 §Output contract).
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(printed()).followups).toEqual([]);
  });

  it(`should report a failed collection with the reason`, async () => {
    mockCollect(async () => {
      throw new Error('No target found.');
    });

    const error = await runtimeErrorsAsync(errorsOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_ERRORS_FAILED');
    expect(error.message).toContain('No target found.');
  });
});

// @ref ../runtimeErrorCollector, ../../dev/logErrors — friction run 6, F52. Expo Go for Android
// acknowledges `Runtime.enable` and then sends nothing, so this command reported an empty window,
// exit 0, for an app on a red screen — and `--fail-on-error` called that health.
describe(`${runtimeErrorsAsync.name} on a runtime with no debugger`, () => {
  /** A collector that answers with nothing and says why nothing is all it can answer with. */
  function mockBlindCollect(records: any[] = []) {
    const collectAsync = jest.fn(async () => records);
    jest.mocked(CdpRuntimeErrorCollector).mockImplementation(
      () =>
        ({
          collectAsync,
          capability: {
            blind: true,
            evidence: 'the runtime answered Runtime.evaluate with "method not found" (-32601)',
          },
        }) as any
    );
    return collectAsync;
  }

  it(`puts a caveat above the empty window instead of reporting it as quiet`, async () => {
    mockBlindCollect();

    await runtimeErrorsAsync(errorsOptions);

    const said = printed();
    // Above, not after: a reader who takes one line takes the first one.
    expect(said.indexOf('CAVEAT')).toBeLessThan(said.indexOf('No runtime errors'));
    expect(said).toContain('cannot report errors over the debugger protocol');
    expect(said).toContain('method not found');
  });

  it(`exits 22 rather than 0 when --fail-on-error has nothing to judge`, async () => {
    mockBlindCollect();
    const complaints = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runtimeErrorsAsync({ ...errorsOptions, failOnError: true })).resolves.toBe(22);

    expect(complaints.mock.calls.flat().join('\n')).toContain('has nothing to judge');
  });

  it(`reports the runtime as unreadable in the machine shape`, async () => {
    mockBlindCollect();

    await runtimeErrorsAsync({ ...errorsOptions, json: true });

    const report = JSON.parse(printed());
    expect(report.runtimeReadable).toBe(false);
    expect(report.runtimeEvidence).toContain('method not found');
    expect(report.devServerLog.read).toBe(false);
    // No project root was given, so there is no log to read — said, not left blank.
    expect(report.devServerLog.reason).toContain('not run inside a project');
  });

  // F105 — MED, found live on 2026-08-27, and it is the *other* half of F100. F100 was the debugger
  // reading the wrong platform; this is the fallback reading a channel that has no platform at all.
  //
  // llp/0005 §Reading Android errors anyway already records the limit — "the log does not name the
  // platform (Expo's logger only prefixes when the app is not bridgeless, and every modern app is)"
  // — but the caveat printed above the records said they were read from the log "which is where this
  // app's errors do arrive". With an iOS simulator on the same dev server that is false, and it was
  // false in the direction that matters: `runtime:errors --android --fail-on-error` exited **20** on
  // a record whose own text was `[Error: W25 boom on ios]` [observed — 2026-08-27, port 8560].
  //
  // The fix is not scoping — the log cannot be scoped, that is the finding — it is saying so. The
  // caveat names the other platform, and `devServerLog.otherPlatformsConnected` puts it on the wire
  // so an agent can branch on it rather than on prose.
  describe('the dev server log does not say which app wrote a line (F105)', () => {
    const projectRoot = '/project';
    const ANDROID_TARGET = {
      id: 'android-1',
      appId: 'host.exp.exponent',
      deviceName: 'sdk_gphone64_arm64 - 15 - API 35',
      webSocketDebuggerUrl: 'ws://debugger/android',
    };

    const logFile = `${projectRoot}/.expo/dev/logs/dev-detached.log`;

    beforeEach(() => {
      vol.fromJSON({ [logFile]: 'Starting Metro Bundler\n' });
    });

    afterEach(() => vol.reset());

    /**
     * A blind collector that writes an error into the dev server log while its window is open.
     *
     * It has to happen *during* the window: the log is cumulative and the read is bounded by a mark
     * taken before the collector runs, so a line planted in `beforeEach` is correctly counted as
     * `older` rather than as this window's. The text is the live one — an iOS app's error, written
     * with no platform prefix, which is what makes the log unscopeable (F105).
     */
    function mockBlindCollectWritingToLog() {
      jest.mocked(CdpRuntimeErrorCollector).mockImplementation(
        () =>
          ({
            collectAsync: jest.fn(async () => {
              vol.appendFileSync(logFile, ' ERROR  [Error: W25 boom on ios]\n');
              return [];
            }),
            capability: {
              blind: true,
              evidence: 'the runtime answered Runtime.evaluate with "method not found" (-32601)',
            },
          }) as any
      );
    }

    it(`names the other platform whose app is on the same dev server`, async () => {
      mockDevServer([ANDROID_TARGET, TARGET]);
      mockBlindCollectWritingToLog();

      await runtimeErrorsAsync(
        { ...errorsOptions, platform: 'android', json: true },
        { projectRoot }
      );

      const report = JSON.parse(printed());
      expect(report.devServerLog.read).toBe(true);
      expect(report.devServerLog.count).toBe(1);
      expect(report.devServerLog.otherPlatformsConnected).toEqual(['ios']);
      expect(report.errors[0].source).toBe('dev-server-log');
    });

    it(`says nothing of the kind when this platform's app is the only one connected`, async () => {
      mockDevServer([ANDROID_TARGET]);
      mockBlindCollect();

      await runtimeErrorsAsync(
        { ...errorsOptions, platform: 'android', json: true },
        { projectRoot }
      );

      expect(JSON.parse(printed()).devServerLog.otherPlatformsConnected).toEqual([]);
    });

    it(`puts the ambiguity in the caveat a reader sees, not only in the JSON`, async () => {
      mockDevServer([ANDROID_TARGET, TARGET]);
      mockBlindCollectWritingToLog();

      await runtimeErrorsAsync({ ...errorsOptions, platform: 'android' }, { projectRoot });

      const said = printed();
      expect(said).toContain('does not say which app wrote a line');
      expect(said).toContain('ios');
      // And the sentence that was wrong is gone: nothing here may claim the records are this app's.
      expect(said).not.toContain("where this app's errors do arrive");
    });
  });
});
