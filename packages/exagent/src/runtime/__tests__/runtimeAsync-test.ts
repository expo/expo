import { CdpClient, CdpRequestError, RPC_METHOD_NOT_FOUND } from '../cdpClient';
import {
  CdpNetworkCollector,
  NetworkDomainUnavailableError,
  targetAdvertisesNetworkPanel,
} from '../networkCollector';
import { runtimeErrorsAsync, runtimeEvalAsync, runtimeNetworkAsync } from '../runtimeAsync';
import { CdpRuntimeErrorCollector } from '../runtimeErrorCollector';
import { UNTRUSTED_OUTPUT_BEGIN } from '../untrusted';

// The real error class and the real code are kept: the command branches on both.
jest.mock('../cdpClient', () => ({
  ...jest.requireActual('../cdpClient'),
  CdpClient: jest.fn(),
}));
jest.mock('../runtimeErrorCollector', () => ({ CdpRuntimeErrorCollector: jest.fn() }));
// The real error class and the real flag reader are kept: the command branches on both.
jest.mock('../networkCollector', () => ({
  ...jest.requireActual('../networkCollector'),
  CdpNetworkCollector: jest.fn(),
}));

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

function mockNetwork(implementation: () => Promise<any>) {
  const collectAsync = jest.fn(implementation);
  jest.mocked(CdpNetworkCollector).mockImplementation(() => ({ collectAsync }) as any);
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

  // Expo Go for Android has no CDP debugger, so this is not a transient failure: no retry and no
  // longer timeout will make it work, and the message must not promise a reading command works.
  it(`should report an unsupported evaluate instead of a failed one`, async () => {
    mockEvaluate(async () => {
      throw new CdpRequestError('The app rejected the evaluate request', RPC_METHOD_NOT_FOUND);
    });

    const error = await runtimeEvalAsync(evalOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_EVALUATE_UNSUPPORTED');
    expect(error.message).toContain('Expo Go for Android');
    expect(error.message).toContain('report an empty window');
    expect(error.message).not.toMatch(/--timeout/);
    expect(error.suggestedCommand).toBe('npx exagent runtime:errors');
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
          command: 'npx exagent runtime:errors --duration 4000',
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

    expect(printed()).toContain('Suggested next:');
    expect(printed()).toContain('npx exagent runtime:errors --duration 2000');
  });

  it(`should ask for a longer window when nothing was reported`, async () => {
    mockCollect(async () => []);

    await runtimeErrorsAsync(errorsOptions);

    expect(printed()).toContain('npx exagent runtime:errors --duration 4000');
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

const networkOptions = {
  action: 'network' as const,
  devServerUrl,
  durationMs: 5000,
  json: false,
  followups: true,
};

const REQUEST = {
  requestId: 'r1',
  method: 'GET',
  url: 'http://api.example.com/users',
  timestamp: 1700000000000,
  status: 200,
  statusText: 'OK',
  mimeType: 'application/json',
  failure: null,
};

describe(runtimeNetworkAsync, () => {
  it(`should report an empty window without an untrusted fence`, async () => {
    mockNetwork(async () => []);

    await expect(runtimeNetworkAsync(networkOptions)).resolves.toBe(0);

    expect(CdpNetworkCollector).toHaveBeenCalledWith({
      metroUrl: devServerUrl,
      durationMs: 5000,
    });
    expect(printed()).toContain('No network requests were reported');
    expect(printed()).not.toContain(UNTRUSTED_OUTPUT_BEGIN);
  });

  it(`should print one line per request, fenced as untrusted`, async () => {
    mockNetwork(async () => [REQUEST]);

    await expect(runtimeNetworkAsync(networkOptions)).resolves.toBe(0);

    expect(printed()).toContain('Collected 1 network request(s)');
    expect(printed()).toContain('[1] GET http://api.example.com/users 200 application/json');
    expect(printed()).toContain(UNTRUSTED_OUTPUT_BEGIN);
  });

  it(`should print the machine shape with --json`, async () => {
    mockNetwork(async () => [REQUEST]);

    await runtimeNetworkAsync({ ...networkOptions, json: true });

    // The object is the whole of stdout: nothing is added for a human to read.
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(printed())).toEqual({
      devServerUrl,
      durationMs: 5000,
      count: 1,
      requests: [REQUEST],
      untrusted: ['requests'],
      followups: [
        {
          id: 'runtime-network-clean',
          command: 'npx exagent runtime:errors --duration 5000',
          why: expect.stringContaining('answered'),
        },
      ],
    });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    mockNetwork(async () => []);

    await runtimeNetworkAsync({ ...networkOptions, json: true });

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'count',
      'devServerUrl',
      'durationMs',
      'followups',
      'requests',
      'untrusted',
    ]);
  });

  it(`should send the caller to the error window when a request failed`, async () => {
    mockNetwork(async () => [{ ...REQUEST, status: null, failure: 'Could not connect.' }]);

    await runtimeNetworkAsync(networkOptions);

    expect(printed()).toContain('1 of them failed');
    expect(printed()).toContain('Suggested next:');
    expect(printed()).toContain('npx exagent runtime:errors --duration 5000');
  });

  // Live behavior: a `fetch` to a closed port is reported as a request the runtime never answered,
  // not as a failure (see the module comment of `networkCollector`).
  it(`should send the caller to the error window when a request never answered`, async () => {
    mockNetwork(async () => [{ ...REQUEST, status: null, mimeType: null }]);

    await runtimeNetworkAsync(networkOptions);

    expect(printed()).toContain('1 of them never answered');
    expect(printed()).toContain('npx exagent runtime:errors --duration 5000');
    expect(printed()).not.toContain('Every request answered');
  });

  it(`should print no Next section with --no-followups`, async () => {
    mockNetwork(async () => []);

    await runtimeNetworkAsync({ ...networkOptions, followups: false });

    expect(printed()).not.toContain('Suggested next:');
  });

  // "The app made no requests" and "this runtime cannot report requests" are different facts:
  // an empty report for the second one would send an agent to debug the wrong thing.
  it(`should report an unsupported Network domain instead of an empty window`, async () => {
    mockNetwork(async () => {
      throw new NetworkDomainUnavailableError(`'Network.enable' wasn't found`, -32601);
    });

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.code).toBe('NETWORK_DOMAIN_UNAVAILABLE');
    expect(error.message).toContain('Network.enable');
    expect(error.message).toContain(`'Network.enable' wasn't found`);
    expect(error.message).toContain('carries no handler for the method');
    expect(error.suggestedCommand).toBe('npx exagent runtime:errors');
    expect(printed()).not.toContain('No network requests were reported');
  });

  it(`should name the network panel flag only for a runtime that has no handler`, async () => {
    mockDevServer([
      { ...TARGET, devtoolsFrontendUrl: '/devtools?unstable_enableNetworkPanel=true' },
    ]);
    mockNetwork(async () => {
      throw new NetworkDomainUnavailableError(`'Network.enable' wasn't found`, -32601);
    });

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.message).toContain('does offer the network panel');
  });

  // F24: the message quoted "multiple hosts" and then blamed a runtime built without the domain
  // and told the caller to upgrade the SDK — advice that could not follow from the quoted cause.
  it(`should explain a multiple-hosts refusal by the host count, not by the SDK`, async () => {
    mockNetwork(async () => {
      throw new NetworkDomainUnavailableError(
        'The Network domain is unavailable when multiple React Native hosts are registered.',
        -32603
      );
    });

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.code).toBe('NETWORK_DOMAIN_UNAVAILABLE');
    expect(error.message).toContain('multiple React Native hosts are registered');
    expect(error.message).toContain('exactly one React Native host');
    expect(error.message).toContain('Relaunch the app');
    // The three claims that contradicted the quoted cause.
    expect(error.message).not.toContain('newer Expo SDK');
    expect(error.message).not.toContain('built without');
    expect(error.message).not.toContain('no handler');
  });

  it(`should quote a refusal it does not recognise and claim nothing about it`, async () => {
    mockNetwork(async () => {
      throw new NetworkDomainUnavailableError('something else entirely');
    });

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.message).toContain('"something else entirely"');
    expect(error.message).toContain('not a refusal this CLI recognises');
    expect(error.message).not.toContain('newer Expo SDK');
  });

  it(`should report a failed collection with the reason`, async () => {
    mockNetwork(async () => {
      throw new Error('No target found.');
    });

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.code).toBe('RUNTIME_NETWORK_FAILED');
    expect(error.message).toContain('No target found.');
  });

  it(`should explain how to start a dev server when none answers`, async () => {
    mockDevServer(null);
    const collectAsync = mockNetwork(async () => []);

    const error = await runtimeNetworkAsync(networkOptions).catch((e) => e);

    expect(error.code).toBe('NO_DEV_SERVER');
    expect(collectAsync).not.toHaveBeenCalled();
  });
});

// The flag reader is not mocked away, so the error message above reads the real target shape.
describe('network panel flag', () => {
  it(`should stay the real implementation under the partial module mock`, () => {
    expect(
      targetAdvertisesNetworkPanel({ devtoolsFrontendUrl: '/x?unstable_enableNetworkPanel=true' })
    ).toBe(true);
  });
});
