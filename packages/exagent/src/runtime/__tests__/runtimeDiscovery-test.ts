// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// Which dev server a runtime command talks to. The commands used to assume 8081 whenever
// `--dev-server-url` was absent, which missed every dev server that had to walk to another port.

import * as Log from '../../log';
import { CdpClient } from '../cdpClient';
import { discoverDevServerAsync, requireConnectedAppAsync } from '../devServer';
import { CdpNetworkCollector } from '../networkCollector';
import type {
  RuntimeErrorsOptions,
  RuntimeEvalOptions,
  RuntimeNetworkOptions,
} from '../resolveOptions';
import { runtimeErrorsAsync, runtimeEvalAsync, runtimeNetworkAsync } from '../runtimeAsync';
import { CdpRuntimeErrorCollector } from '../runtimeErrorCollector';

jest.mock('../../log');
jest.mock('../devServer', () => ({
  discoverDevServerAsync: jest.fn(),
  requireConnectedAppAsync: jest.fn(),
  normalizeDevServerUrl: (url: string) => url,
}));
jest.mock('../cdpClient', () => ({
  ...jest.requireActual('../cdpClient'),
  CdpClient: jest.fn(),
}));
jest.mock('../runtimeErrorCollector', () => ({ CdpRuntimeErrorCollector: jest.fn() }));
jest.mock('../networkCollector', () => ({
  ...jest.requireActual('../networkCollector'),
  CdpNetworkCollector: jest.fn(),
}));

const projectRoot = '/project';

const evalOptions: RuntimeEvalOptions = {
  action: 'eval',
  expression: '1 + 1',
  devServerUrl: null,
  timeoutMs: 100,
  awaitPromise: true,
  json: true,
};

const errorsOptions: RuntimeErrorsOptions = {
  action: 'errors',
  devServerUrl: null,
  durationMs: 0,
  json: true,
  followups: false,
};

const networkOptions: RuntimeNetworkOptions = {
  action: 'network',
  devServerUrl: null,
  durationMs: 0,
  json: true,
  followups: false,
};

/** Make discovery answer with one URL, as if the project's lock had named it. */
function mockDiscovered(devServerUrl: string) {
  jest.mocked(discoverDevServerAsync).mockResolvedValue({
    reachable: true,
    targets: [],
    devServerUrl,
    source: 'lock',
    discovered: true,
  });
}

beforeEach(() => {
  jest.mocked(requireConnectedAppAsync).mockResolvedValue([]);
  jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync: async () => ({}) }) as any);
  jest
    .mocked(CdpRuntimeErrorCollector)
    .mockImplementation(() => ({ collectAsync: async () => [] }) as any);
  jest
    .mocked(CdpNetworkCollector)
    .mockImplementation(() => ({ collectAsync: async () => [] }) as any);
  mockDiscovered('http://127.0.0.1:8083');
});

describe('the dev server a runtime command talks to', () => {
  it.each([
    ['runtime:eval', () => runtimeEvalAsync(evalOptions, { projectRoot })],
    ['runtime:errors', () => runtimeErrorsAsync(errorsOptions, { projectRoot })],
    ['runtime:network', () => runtimeNetworkAsync(networkOptions, { projectRoot })],
  ])(`%s discovers it from the project when no URL was given`, async (_name, run) => {
    await run();

    expect(discoverDevServerAsync).toHaveBeenCalledWith(undefined, { projectRoot });
    expect(requireConnectedAppAsync).toHaveBeenCalledWith('http://127.0.0.1:8083');
  });

  it.each([
    [
      'runtime:eval',
      () => runtimeEvalAsync({ ...evalOptions, devServerUrl: 'http://host:9000' }, { projectRoot }),
    ],
    [
      'runtime:errors',
      () =>
        runtimeErrorsAsync({ ...errorsOptions, devServerUrl: 'http://host:9000' }, { projectRoot }),
    ],
    [
      'runtime:network',
      () =>
        runtimeNetworkAsync(
          { ...networkOptions, devServerUrl: 'http://host:9000' },
          { projectRoot }
        ),
    ],
  ])(`%s uses the URL it was given, and discovers nothing`, async (_name, run) => {
    await run();

    // The caller was specific, so nothing is guessed around it — the flag semantics are unchanged.
    expect(discoverDevServerAsync).not.toHaveBeenCalled();
    expect(requireConnectedAppAsync).toHaveBeenCalledWith('http://host:9000');
  });

  it(`reports the discovered dev server in the output`, async () => {
    await runtimeErrorsAsync(errorsOptions, { projectRoot });

    expect(jest.mocked(Log.log).mock.calls.flat().join('\n')).toContain('http://127.0.0.1:8083');
  });

  it(`discovers without a project when the command runs outside one`, async () => {
    await runtimeErrorsAsync(errorsOptions);

    expect(discoverDevServerAsync).toHaveBeenCalledWith(undefined, { projectRoot: undefined });
  });
});
