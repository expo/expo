// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// Which dev server a runtime command talks to. The commands used to assume 8081 whenever
// `--dev-server-url` was absent, which missed every dev server that had to walk to another port.
//
// The discovery step is `src/runtime/preflight.ts` now, and it is the *only* step: a named URL is
// probed as named, an unnamed one is discovered, and either way the answer is read once and handed
// to the command (llp/0005 §One preflight for the runtime family).

import * as Log from '../../log';
import { CdpClient } from '../cdpClient';
import { discoverDevServerAsync } from '../devServer';
import type { RuntimeErrorsOptions, RuntimeEvalOptions } from '../resolveOptions';
import { runtimeErrorsAsync, runtimeEvalAsync } from '../runtimeAsync';
import { CdpRuntimeErrorCollector } from '../runtimeErrorCollector';

jest.mock('../../log');
jest.mock('../devServer', () => ({
  ...jest.requireActual('../devServer'),
  discoverDevServerAsync: jest.fn(),
}));
jest.mock('../cdpClient', () => ({
  ...jest.requireActual('../cdpClient'),
  CdpClient: jest.fn(),
}));
jest.mock('../runtimeErrorCollector', () => ({ CdpRuntimeErrorCollector: jest.fn() }));

const projectRoot = '/project';

/** A connected app, so the preflight resolves rather than refuses. */
const TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  deviceName: 'iPhone 17',
  description: '',
  type: 'native',
  title: 'Expo Go',
  devtoolsFrontendUrl: '/devtools',
  webSocketDebuggerUrl: 'ws://debugger',
};

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
  failOnError: false,
};

/** Make discovery answer with one URL, as if the project's lock had named it. */
function mockDiscovered(devServerUrl: string) {
  jest.mocked(discoverDevServerAsync).mockResolvedValue({
    reachable: true,
    targets: [TARGET],
    devServerUrl,
    source: 'lock',
    discovered: true,
  });
}

/** The dev server the command actually opened a debugger connection to. */
function metroUrlOfClient(): string | undefined {
  return jest.mocked(CdpClient).mock.calls[0]?.[0]?.metroUrl;
}

beforeEach(() => {
  jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync: async () => ({}) }) as any);
  jest
    .mocked(CdpRuntimeErrorCollector)
    .mockImplementation(() => ({ collectAsync: async () => [] }) as any);
  mockDiscovered('http://127.0.0.1:8083');
});

describe('the dev server a runtime command talks to', () => {
  it.each([
    ['runtime:eval', () => runtimeEvalAsync(evalOptions, { projectRoot })],
    ['runtime:errors', () => runtimeErrorsAsync(errorsOptions, { projectRoot })],
  ])(`%s discovers it from the project when no URL was given`, async (_name, run) => {
    await run();

    expect(discoverDevServerAsync).toHaveBeenCalledWith(undefined, { projectRoot });
    // Discovered once and used everywhere after that: the discovered URL is what the report names
    // and what the debugger connection is opened on.
    expect(jest.mocked(Log.log).mock.calls.flat().join('\n')).toContain('http://127.0.0.1:8083');
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
  ])(`%s probes the URL it was given, and guesses nothing around it`, async (_name, run) => {
    mockDiscovered('http://host:9000');

    await run();

    // The caller was specific, so the named URL is the only one tried — no lock, no log, no scan.
    // `source: flag` is what keeps the failure from suggesting the flag this caller just passed.
    expect(discoverDevServerAsync).toHaveBeenCalledWith('http://host:9000', { projectRoot });
    expect(jest.mocked(Log.log).mock.calls.flat().join('\n')).toContain('http://host:9000');
  });

  it(`opens the debugger connection on the dev server it found`, async () => {
    await runtimeEvalAsync(evalOptions, { projectRoot });

    expect(metroUrlOfClient()).toBe('http://127.0.0.1:8083');
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
