import { CdpClient } from '../cdpClient';
import { runtimeErrorsAsync, runtimeEvalAsync } from '../runtimeAsync';
import { CdpRuntimeErrorCollector } from '../runtimeErrorCollector';
import { UNTRUSTED_OUTPUT_BEGIN } from '../untrusted';

jest.mock('../cdpClient', () => ({ CdpClient: jest.fn() }));
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
      untrusted: ['value', 'description', 'exception'],
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
    expect(error.message).toContain('npx expo start');
    expect(evaluateAsync).not.toHaveBeenCalled();
  });

  it(`should explain how to connect an app when the dev server has no target`, async () => {
    mockDevServer([]);
    mockEvaluate(async () => ({ value: 1 }));

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('NO_APP_CONNECTED');
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
};

describe(runtimeErrorsAsync, () => {
  it(`should report an empty window without an untrusted fence`, async () => {
    mockCollect(async () => []);

    await expect(runtimeErrorsAsync(errorsOptions)).resolves.toBe(0);

    expect(CdpRuntimeErrorCollector).toHaveBeenCalledWith({
      metroUrl: devServerUrl,
      durationMs: 2000,
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
      untrusted: ['errors'],
      followups: [
        {
          id: 'runtime-errors-reproduce',
          command: 'npx exagent runtime errors --duration 4000',
          why: expect.stringContaining('reproduce'),
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
      'devServerUrl',
      'durationMs',
      'errors',
      'followups',
      'untrusted',
    ]);
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — the runtime loop.
  it(`should ask for a rerun after the reported errors are fixed`, async () => {
    mockCollect(async () => [{ source: 'console', timestamp: 1, message: 'Request failed' }]);

    await runtimeErrorsAsync(errorsOptions);

    expect(printed()).toContain('Next:');
    expect(printed()).toContain('npx exagent runtime errors --duration 2000');
  });

  it(`should ask for a longer window when nothing was reported`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync(errorsOptions);

    expect(printed()).toContain('npx exagent runtime errors --duration 4000');
  });

  it(`should print no Next section with --no-followups`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync({ ...errorsOptions, followups: false });

    expect(printed()).not.toContain('Next:');
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
