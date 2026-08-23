// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The exit-code table of `dev:wait`, which is the whole point of the command: an agent branches on
// the code before it reads a word of the output, so "ready", "not yet" and "not a dev server" must
// never collapse into one number.

import { event } from '../../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import * as Log from '../../log';
import { discoverDevServerAsync } from '../../runtime/devServer';
import { waitForAppConnectionAsync, waitForBundlerReadyAsync } from '../../runtime/waitReady';
import type { DevWaitOptions } from '../resolveWaitOptions';
import { devWaitAsync } from '../waitAsync';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../runtime/devServer', () => ({ discoverDevServerAsync: jest.fn() }));
jest.mock('../../runtime/waitReady', () => ({
  waitForBundlerReadyAsync: jest.fn(),
  waitForAppConnectionAsync: jest.fn(),
}));

const projectRoot = '/project';
const devServerUrl = 'http://127.0.0.1:8081';

function options(overrides: Partial<DevWaitOptions> = {}): DevWaitOptions {
  return {
    devServerUrl: null,
    timeoutMs: 5000,
    requireApp: false,
    json: false,
    followups: true,
    ...overrides,
  };
}

/** Make discovery answer with a dev server that is up, with `apps` debugger targets. */
function mockDiscovery(apps = 1, overrides: Record<string, unknown> = {}) {
  jest.mocked(discoverDevServerAsync).mockResolvedValue({
    reachable: true,
    targets: Array.from({ length: apps }, (_, index) => ({ id: `${index}` }) as any),
    devServerUrl,
    source: 'lock',
    discovered: true,
    ...overrides,
  });
}

/** Make the readiness wait answer as a dev server that finished bundling. */
function mockReady(overrides: Record<string, unknown> = {}) {
  jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
    ready: true,
    projectRootMatched: true,
    reportedProjectRoot: projectRoot,
    timedOut: false,
    waitedMs: 42,
    ...overrides,
  });
}

/** The one JSON object `--json` printed. */
function printedJson(): any {
  const printed = jest.mocked(Log.log).mock.calls.map(([line]) => line);
  return JSON.parse(printed[0] as string);
}

beforeEach(() => {
  mockDiscovery();
  mockReady();
});

describe(devWaitAsync, () => {
  it(`should exit 0 when the bundler is ready`, async () => {
    expect(await devWaitAsync(projectRoot, options())).toBe(EXIT_OK);
  });

  it(`should exit 22 when the wait expires, so a caller knows to wait longer`, async () => {
    mockReady({ ready: false, timedOut: true, projectRootMatched: null, reason: 'still bundling' });

    expect(await devWaitAsync(projectRoot, options())).toBe(EXIT_OUTCOME_TIMEOUT);
  });

  // Retrying is the obvious next move after a timeout and a waste of minutes here, so the two
  // outcomes cannot share a code.
  it(`should exit 20 when something that is not a dev server answered`, async () => {
    mockReady({
      ready: false,
      timedOut: false,
      projectRootMatched: null,
      reason: 'not an Expo dev server',
    });

    expect(await devWaitAsync(projectRoot, options())).toBe(EXIT_OUTCOME_FAILED);
  });

  it(`should fail as a tool error when no dev server answered at all`, async () => {
    jest.mocked(discoverDevServerAsync).mockResolvedValue({
      reachable: false,
      targets: [],
      reason: 'ECONNREFUSED',
      devServerUrl,
      source: 'default',
      discovered: false,
    });

    // There was nothing to wait on, so this is the tool failing rather than an outcome: it throws,
    // and `logCmdError` exits 1.
    await expect(devWaitAsync(projectRoot, options())).rejects.toMatchObject({
      code: 'NO_DEV_SERVER',
      suggestedCommand: 'npx exagent dev',
    });
    expect(jest.mocked(waitForBundlerReadyAsync)).not.toHaveBeenCalled();
  });

  it(`should report a ready bundler that belongs to another project`, async () => {
    mockReady({ projectRootMatched: false, reportedProjectRoot: '/other-project' });

    // Still ready, so still 0: the wait was answered. The mismatch is what the report is for.
    expect(await devWaitAsync(projectRoot, options({ json: true }))).toBe(EXIT_OK);
    expect(printedJson()).toMatchObject({ ok: true, projectRootMatched: false });
    expect(printedJson().followups[0].id).toBe('dev-wait-other-project');
  });

  describe('--require-app', () => {
    it(`should wait for an app on what is left of the budget`, async () => {
      mockDiscovery(0);
      jest
        .mocked(waitForAppConnectionAsync)
        .mockResolvedValue({ appsConnected: 1, timedOut: false, waitedMs: 100 });

      expect(await devWaitAsync(projectRoot, options({ requireApp: true }))).toBe(EXIT_OK);
      // The budget is the command's, not a second one of the same size.
      const [, appOptions] = jest.mocked(waitForAppConnectionAsync).mock.calls[0]!;
      expect(appOptions.timeoutMs).toBeLessThanOrEqual(5000);
    });

    it(`should exit 22 when no app ever attaches`, async () => {
      mockDiscovery(0);
      jest
        .mocked(waitForAppConnectionAsync)
        .mockResolvedValue({ appsConnected: 0, timedOut: true, waitedMs: 5000 });

      expect(await devWaitAsync(projectRoot, options({ requireApp: true }))).toBe(
        EXIT_OUTCOME_TIMEOUT
      );
    });

    it(`should not wait for an app when the bundle was never built`, async () => {
      mockReady({ ready: false, timedOut: true, projectRootMatched: null });

      await devWaitAsync(projectRoot, options({ requireApp: true }));

      // There is nothing for an app to run, so waiting for one would only burn the budget.
      expect(jest.mocked(waitForAppConnectionAsync)).not.toHaveBeenCalled();
    });

    it(`should ignore attached apps when none was required`, async () => {
      mockDiscovery(0);

      // The dev server has no app, but only the bundler was asked about.
      expect(await devWaitAsync(projectRoot, options())).toBe(EXIT_OK);
      expect(jest.mocked(waitForAppConnectionAsync)).not.toHaveBeenCalled();
    });
  });

  describe('--json', () => {
    it(`should print exactly one object, with the keys of the contract`, async () => {
      await devWaitAsync(projectRoot, options({ json: true }));

      expect(jest.mocked(Log.log)).toHaveBeenCalledTimes(1);
      expect(Object.keys(printedJson()).sort()).toEqual([
        'appsConnected',
        'devServerUrl',
        'followups',
        'ok',
        'projectRoot',
        'projectRootMatched',
        'ready',
        'source',
        'timedOut',
        'waitedMs',
      ]);
    });

    it(`should report a wait that expired as not ok`, async () => {
      mockReady({ ready: false, timedOut: true, projectRootMatched: null });

      await devWaitAsync(projectRoot, options({ json: true }));

      expect(printedJson()).toMatchObject({ ok: false, ready: false, timedOut: true });
    });
  });

  it(`should emit the answer on the event stream, whatever the output mode`, async () => {
    await devWaitAsync(projectRoot, options());

    expect(jest.mocked(event)).toHaveBeenCalledWith('dev_wait', {
      devServerUrl,
      source: 'lock',
      ready: true,
      projectRootMatched: true,
      appsConnected: 1,
      waitedMs: expect.any(Number),
      timedOut: false,
    });
  });

  it(`should print labelled lines when --json was not asked for`, async () => {
    await devWaitAsync(projectRoot, options());

    const printed = jest
      .mocked(Log.log)
      .mock.calls.map(([line]) => line)
      .join('\n');
    expect(printed).toContain('dev server');
    expect(printed).toContain(devServerUrl);
    expect(printed).toContain('via lock');
    expect(printed).toContain('ready');
  });

  it(`should skip the follow-ups when they were turned off`, async () => {
    await devWaitAsync(projectRoot, options({ json: true, followups: false }));

    expect(printedJson().followups).toEqual([]);
  });
});
