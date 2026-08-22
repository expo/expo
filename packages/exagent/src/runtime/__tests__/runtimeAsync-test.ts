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

    expect(JSON.parse(printed())).toEqual({
      devServerUrl,
      expression: 'globalThis.count',
      threw: false,
      type: 'object',
      value: { id: 7 },
      untrusted: ['value', 'description', 'exception'],
    });
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

    expect(JSON.parse(printed())).toEqual({
      devServerUrl,
      durationMs: 2000,
      count: 0,
      errors: [],
      untrusted: ['errors'],
    });
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
