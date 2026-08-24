// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The exit-code table of `dev:wait`, which is the whole point of the command: an agent branches on
// the code before it reads a word of the output, so "ready", "not yet" and "not a dev server" must
// never collapse into one number.

import { event } from '../../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import * as Log from '../../log';
import { checkEntryBundleAsync, type BundleCheckResult } from '../../runtime/bundleCheck';
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
jest.mock('../../runtime/bundleCheck', () => ({
  ...jest.requireActual('../../runtime/bundleCheck'),
  checkEntryBundleAsync: jest.fn(),
}));

const projectRoot = '/project';
const devServerUrl = 'http://127.0.0.1:8081';

function options(overrides: Partial<DevWaitOptions> = {}): DevWaitOptions {
  return {
    devServerUrl: null,
    timeoutMs: 5000,
    requireApp: false,
    // Off unless a test is about it: the bundle check is one more HTTP round trip, and the cases
    // below are about the readiness gate.
    bundleCheck: false,
    platform: 'ios',
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

/** Make the entry-bundle check answer with one outcome. */
function mockBundle(overrides: Partial<BundleCheckResult> = {}) {
  jest.mocked(checkEntryBundleAsync).mockResolvedValue({
    outcome: 'ok',
    platform: 'ios',
    url: 'http://127.0.0.1:8081/index.bundle?platform=ios',
    error: null,
    waitedMs: 120,
    ...overrides,
  });
}

/** The transform error a broken project produces, as `bundleCheck` reshapes it. */
const BROKEN_BUNDLE: Partial<BundleCheckResult> = {
  outcome: 'broken',
  error: {
    type: 'TransformError',
    filename: 'src/app/index.tsx',
    lineNumber: 101,
    column: 2,
    message: "SyntaxError: Unexpected keyword 'const'. (101:2)",
    snippet: '> 101 |   const x =',
  },
};

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

  // The human report always said "serves /other-project, not /project"; `ok: true` and exit 0 said
  // the opposite to the only reader that branches on them.
  it(`should fail on a ready bundler that belongs to another project`, async () => {
    mockReady({ projectRootMatched: false, reportedProjectRoot: '/other-project' });

    expect(await devWaitAsync(projectRoot, options({ json: true }))).toBe(EXIT_OUTCOME_FAILED);
    expect(printedJson()).toMatchObject({ ok: false, ready: true, projectRootMatched: false });
    expect(printedJson().followups[0].id).toBe('dev-wait-other-project');
  });

  // A longer wait cannot turn another project's dev server into this one's, so the code must not
  // be the one that means "look again".
  it(`should report another project's dev server as failed, never as timed out`, async () => {
    mockReady({ projectRootMatched: false, reportedProjectRoot: '/other-project' });
    jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
      ready: false,
      timedOut: true,
      projectRootMatched: false,
      reportedProjectRoot: '/other-project',
      waitedMs: 10,
    });

    expect(await devWaitAsync(projectRoot, options())).toBe(EXIT_OUTCOME_FAILED);
  });

  // Undecidable is not a mismatch: a dev server that named no project root has not been shown to
  // be the wrong one, and failing on it would fail every server too old to send the header.
  it(`should still pass when the project could not be decided`, async () => {
    mockReady({ projectRootMatched: null, reportedProjectRoot: null });

    expect(await devWaitAsync(projectRoot, options({ json: true }))).toBe(EXIT_OK);
    expect(printedJson()).toMatchObject({ ok: true, projectRootMatched: null });
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

  // The finding this check exists for: the dev server was healthy, the project had a syntax error
  // in it, and every health command in the CLI answered green.
  describe('the entry-bundle check', () => {
    beforeEach(() => {
      mockBundle();
    });

    it(`should build the entry bundle once the dev server is ready`, async () => {
      expect(await devWaitAsync(projectRoot, options({ bundleCheck: true }))).toBe(EXIT_OK);

      const [url, checkOptions] = jest.mocked(checkEntryBundleAsync).mock.calls[0]!;
      expect(url).toBe(devServerUrl);
      expect(checkOptions.platform).toBe('ios');
      // The budget is the command's, not a second one of the same size.
      expect(checkOptions.timeoutMs).toBeLessThanOrEqual(5000);
    });

    it(`should exit 20 and name the file when the bundle does not compile`, async () => {
      mockBundle(BROKEN_BUNDLE);

      expect(await devWaitAsync(projectRoot, options({ bundleCheck: true, json: true }))).toBe(
        EXIT_OUTCOME_FAILED
      );
      expect(printedJson()).toMatchObject({
        ok: false,
        // The dev server was healthy the whole time. That was never the question.
        ready: true,
        bundle: {
          checked: true,
          ok: false,
          platform: 'ios',
          error: {
            filename: 'src/app/index.tsx',
            lineNumber: 101,
            column: 2,
            message: expect.stringContaining('Unexpected keyword'),
          },
        },
      });
    });

    it(`should point the follow-up at the file the bundler stopped on`, async () => {
      mockBundle(BROKEN_BUNDLE);

      await devWaitAsync(projectRoot, options({ bundleCheck: true, json: true }));

      const [followup] = printedJson().followups;
      expect(followup.id).toBe('dev-wait-bundle-broken');
      expect(followup.why).toContain('src/app/index.tsx:101');
    });

    it(`should print the file, line and message for a human`, async () => {
      mockBundle(BROKEN_BUNDLE);

      await devWaitAsync(projectRoot, options({ bundleCheck: true }));

      const printed = jest
        .mocked(Log.log)
        .mock.calls.map(([line]) => line)
        .join('\n');
      expect(printed).toContain('does not compile');
      expect(printed).toContain('src/app/index.tsx:101:2');
      expect(printed).toContain("Unexpected keyword 'const'");
      expect(printed).toContain('> 101 |   const x =');
    });

    // Nothing can attach to a bundle that does not exist, so waiting for one would spend the rest
    // of the budget learning what the check already knows.
    it(`should not wait for an app on a bundle that does not compile`, async () => {
      mockBundle(BROKEN_BUNDLE);

      await devWaitAsync(projectRoot, options({ bundleCheck: true, requireApp: true }));

      expect(jest.mocked(waitForAppConnectionAsync)).not.toHaveBeenCalled();
    });

    // 22 means "look again"; a file with a syntax error in it does not parse on the second look.
    it(`should report a broken bundle as failed, never as timed out`, async () => {
      mockBundle(BROKEN_BUNDLE);
      jest.mocked(waitForBundlerReadyAsync).mockResolvedValue({
        ready: true,
        projectRootMatched: true,
        reportedProjectRoot: projectRoot,
        timedOut: true,
        waitedMs: 4000,
      });

      expect(await devWaitAsync(projectRoot, options({ bundleCheck: true }))).toBe(
        EXIT_OUTCOME_FAILED
      );
    });

    it(`should exit 22 when the first cold build does not finish in the budget`, async () => {
      mockBundle({ outcome: 'timeout', reason: 'the bundler did not finish within 5000ms' });

      expect(await devWaitAsync(projectRoot, options({ bundleCheck: true, json: true }))).toBe(
        EXIT_OUTCOME_TIMEOUT
      );
      expect(printedJson()).toMatchObject({ ok: false, timedOut: true, bundle: { ok: null } });
    });

    // A dev server that answered nothing the check understands has not shown the project to be
    // broken, so the gate stays green and says why it could not decide.
    it(`should pass when the check could not decide`, async () => {
      mockBundle({ outcome: 'unknown', url: null, reason: 'no launchAsset.url' });

      expect(await devWaitAsync(projectRoot, options({ bundleCheck: true, json: true }))).toBe(
        EXIT_OK
      );
      // `checked` follows `ok`: a check that decided nothing did not check anything, and saying
      // otherwise is a contradiction a caller cannot act on.
      expect(printedJson().bundle).toMatchObject({
        checked: false,
        ok: null,
        reason: 'no launchAsset.url',
      });
    });

    it(`should not build anything with --no-bundle-check`, async () => {
      expect(await devWaitAsync(projectRoot, options({ bundleCheck: false, json: true }))).toBe(
        EXIT_OK
      );
      expect(jest.mocked(checkEntryBundleAsync)).not.toHaveBeenCalled();
      expect(printedJson().bundle).toEqual({
        checked: false,
        ok: null,
        platform: null,
        url: null,
        error: null,
        reason: 'the entry bundle check was not run',
      });
    });

    // Building *their* entry bundle answers nothing about this project's code, and it would spend
    // the caller's whole budget doing it.
    it(`should not build another project's bundle`, async () => {
      mockReady({ projectRootMatched: false, reportedProjectRoot: '/other-project' });

      await devWaitAsync(projectRoot, options({ bundleCheck: true }));

      expect(jest.mocked(checkEntryBundleAsync)).not.toHaveBeenCalled();
    });

    it(`should not build a bundle the dev server never finished`, async () => {
      mockReady({ ready: false, timedOut: true, projectRootMatched: null });

      await devWaitAsync(projectRoot, options({ bundleCheck: true }));

      expect(jest.mocked(checkEntryBundleAsync)).not.toHaveBeenCalled();
    });

    it(`should carry the outcome and the location on the event stream`, async () => {
      mockBundle(BROKEN_BUNDLE);

      await devWaitAsync(projectRoot, options({ bundleCheck: true }));

      expect(jest.mocked(event)).toHaveBeenCalledWith(
        'dev_wait',
        expect.objectContaining({
          bundle: {
            outcome: 'broken',
            platform: 'ios',
            filename: 'src/app/index.tsx',
            lineNumber: 101,
          },
        })
      );
    });
  });

  describe('--json', () => {
    it(`should print exactly one object, with the keys of the contract`, async () => {
      await devWaitAsync(projectRoot, options({ json: true }));

      expect(jest.mocked(Log.log)).toHaveBeenCalledTimes(1);
      expect(Object.keys(printedJson()).sort()).toEqual([
        'appsConnected',
        'bundle',
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
      bundle: { outcome: null, platform: null, filename: null, lineNumber: null },
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
