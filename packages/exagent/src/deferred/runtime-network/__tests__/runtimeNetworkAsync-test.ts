// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// The `runtime:network` half of `src/runtime/__tests__/runtimeAsync-test.ts`, moved with the code
// it covers. Not run: `jest.config.js` ignores this directory.

import { runtimeNetworkAsync } from '../runtimeNetworkAsync';
import {
  CdpNetworkCollector,
  NetworkDomainUnavailableError,
  targetAdvertisesNetworkPanel,
} from '../networkCollector';

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
      runtimeReadable: null,
      runtimeEvidence: null,
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
      'runtimeEvidence',
      'runtimeReadable',
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
