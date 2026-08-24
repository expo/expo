import { vol } from 'memfs';
import os from 'os';

import { checkpointBeforeAsync } from '../../checkpoint/integration';
import type { FollowUp } from '../../followups';
import { Log } from '../../log';
import { emitStartPlan } from '../../plan/emit';
import { readLastBuildFingerprints, recordLastBuildFingerprint } from '../../plan/lastBuild';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { runDevServerAsync, type DevServerRun } from '../../start/startAsync';
import { runExpoAsync, spawnExpoAsync } from '../../utils/expoCli';
import { isInteractive } from '../../utils/interactive';
import { confirmPlanAsync } from '../confirmPlan';
import { devAsync } from '../devAsync';
import { resolveDevOptions } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../confirmPlan', () => ({ confirmPlanAsync: jest.fn() }));
jest.mock('../../checkpoint/integration', () => ({ checkpointBeforeAsync: jest.fn() }));
jest.mock('../../plan/emit', () => ({ emitStartPlan: jest.fn() }));
jest.mock('../../plan/events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../plan/lastBuild', () => ({
  readLastBuildFingerprints: jest.fn(() => ({})),
  recordLastBuildFingerprint: jest.fn(),
}));
jest.mock('../../project/probe', () => ({ probeProjectStateAsync: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn(), spawnExpoAsync: jest.fn() }));
jest.mock('../../start/startAsync', () => ({ runDevServerAsync: jest.fn() }));
// A person at a terminal by default, which is the path these tests were written for: the plan's
// steps inherit the terminal, and nothing about their output is this command's business. The
// runs nobody is watching get their own block at the end of the file.
jest.mock('../../utils/interactive', () => ({ isInteractive: jest.fn(() => true) }));
// The follow-ups of a run are reported rather than embedded in the emitted plan, so this is where
// a test reads them. The real reporter still runs, so the `Suggested next:` section is real too.
jest.mock('../../followups', () => {
  const actual = jest.requireActual('../../followups');
  return {
    ...actual,
    reportFollowUps: jest.fn((command: string, followups: any[], options: any) => {
      mockReported.push(followups);
      return actual.reportFollowUps(command, followups, options);
    }),
  };
});

/** Every list of follow-ups the run reported, in order. */
const mockReported: any[][] = [];

const projectRoot = '/project';
const fingerprintHash = 'abc123def4567890';

/** What one dev-server run answers with, as `runDevServerAsync` reports it. */
function devServerRun(overrides: Partial<DevServerRun> = {}): DevServerRun {
  return { exitCode: 0, stdout: '', stderr: '', port: null, ...overrides };
}
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

function mockProjectState(overrides: Partial<ProjectState> = {}): ProjectState {
  const state: ProjectState = {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: fingerprintHash },
    ...overrides,
  };
  jest.mocked(probeProjectStateAsync).mockResolvedValue(state);
  return state;
}

/** The state of a managed project that needs a new development build. */
function mockStaleDevClientState(overrides: Partial<ProjectState> = {}): ProjectState {
  return mockProjectState({
    usesDevClient: true,
    expoGo: {
      compatible: false,
      reasons: [{ kind: 'config-plugin', detail: 'the app config uses a config plugin' }],
    },
    ...overrides,
  });
}

/** The follow-ups the run reported, which are the ones a caller sees. */
function emittedFollowUps(): FollowUp[] {
  return mockReported.at(-1) ?? [];
}

function emittedFollowUpIds(): string[] {
  return emittedFollowUps().map((followup) => followup.id);
}

/** Pin this host's LAN address, so the real-device follow-up does not depend on the machine. */
function mockLanAddress(address: string | null) {
  jest
    .spyOn(os, 'networkInterfaces')
    .mockReturnValue(
      address
        ? ({ en0: [{ address, family: 'IPv4', internal: false }] } as any)
        : ({ lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] } as any)
    );
}

beforeEach(() => {
  vol.reset();
  mockReported.length = 0;
  jest.mocked(readLastBuildFingerprints).mockReturnValue({});
  jest.mocked(runExpoAsync).mockResolvedValue(0);
  jest.mocked(isInteractive).mockReturnValue(true);
  jest.mocked(spawnExpoAsync).mockResolvedValue({
    cli: { command: 'expo', args: [] },
    result: { exitCode: 0, stdout: '', stderr: '' },
  });
  jest.mocked(runDevServerAsync).mockResolvedValue(devServerRun());
  jest.mocked(confirmPlanAsync).mockResolvedValue(true);
  mockLanAddress('192.168.1.5');
});

afterEach(() => {
  mockPlatform(realPlatform);
  jest.restoreAllMocks();
});

describe(devAsync, () => {
  describe('--plan', () => {
    it(`should emit the plan and run nothing`, async () => {
      mockStaleDevClientState();

      await expect(devAsync(projectRoot, resolveDevOptions(['--plan', '--ios']))).resolves.toBe(0);

      expect(emitStartPlan).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'dev-client-stale' }),
        { mode: 'plan', json: false, followups: expect.any(Array) }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
      expect(runDevServerAsync).not.toHaveBeenCalled();
    });

    it(`should decide from the probed project state`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--plan']));

      expect(probeProjectStateAsync).toHaveBeenCalledWith(projectRoot);
      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'plan',
        json: false,
        followups: expect.any(Array),
      });
    });
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status` — Default change
  describe('no flag (running the plan is the default)', () => {
    it(`should emit the plan and run it`, async () => {
      mockProjectState();

      await expect(devAsync(projectRoot, resolveDevOptions([]))).resolves.toBe(0);

      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'smart',
        print: 'text',
        followups: [],
      });
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: true,
        output: 'inherit',
      });
    });

    it(`should run every step of a plan that builds`, async () => {
      mockStaleDevClientState();

      await expect(devAsync(projectRoot, resolveDevOptions(['--ios']))).resolves.toBe(0);

      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'ios']);
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:ios'], {
        agentSkills: true,
        output: 'inherit',
      });
    });
  });

  // @ref llp/0008-guardrails.rfc.md §Plan-with-cost dry run
  describe('confirmation', () => {
    it(`should ask about the plan before anything runs`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(confirmPlanAsync).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'dev-client-stale' }),
        expect.objectContaining({ mode: 'run' })
      );
    });

    it(`should run nothing and exit 0 when the plan is declined`, async () => {
      mockStaleDevClientState();
      jest.mocked(confirmPlanAsync).mockResolvedValue(false);

      await expect(devAsync(projectRoot, resolveDevOptions(['--ios']))).resolves.toBe(0);

      expect(runExpoAsync).not.toHaveBeenCalled();
      expect(runDevServerAsync).not.toHaveBeenCalled();
    });

    it(`should not snapshot the project for a plan that was declined`, async () => {
      mockStaleDevClientState();
      jest.mocked(confirmPlanAsync).mockResolvedValue(false);

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(checkpointBeforeAsync).not.toHaveBeenCalled();
    });

    it(`should never ask in --plan mode, which runs nothing anyway`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--plan', '--ios']));

      expect(confirmPlanAsync).not.toHaveBeenCalled();
    });
  });

  describe('running the plan', () => {
    it(`should emit the plan before running any step`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'smart',
        print: 'text',
        followups: [],
      });
    });

    it(`should run a single dev server step through the start wrapper`, async () => {
      mockProjectState();

      await expect(devAsync(projectRoot, resolveDevOptions(['--port', '8082']))).resolves.toBe(0);

      expect(runDevServerAsync).toHaveBeenCalledWith(
        projectRoot,
        ['start', '--go', '--port', '8082'],
        { agentSkills: true, output: 'inherit' }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
    });

    it(`should keep the skill sync opt-out`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--no-agent-skills']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: false,
        output: 'inherit',
      });
    });

    it(`should not repeat a platform flag the plan already passes`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--web']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--web'], {
        agentSkills: true,
        output: 'inherit',
      });
    });

    it(`should run every step in order, ending with the dev server`, async () => {
      mockStaleDevClientState();

      await expect(devAsync(projectRoot, resolveDevOptions(['--ios']))).resolves.toBe(0);

      expect(runExpoAsync).toHaveBeenCalledTimes(1);
      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'ios']);
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:ios'], {
        agentSkills: true,
        output: 'inherit',
      });
    });

    it(`should snapshot the project before a plan that prebuilds`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(checkpointBeforeAsync).toHaveBeenCalledWith(projectRoot, {
        label: 'exagent dev',
        enabled: true,
        silent: false,
      });
    });

    it(`should not snapshot a plan that only starts the dev server`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(checkpointBeforeAsync).not.toHaveBeenCalled();
    });

    it(`should skip the snapshot with --no-checkpoint`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios', '--no-checkpoint']));

      expect(checkpointBeforeAsync).toHaveBeenCalledWith(
        projectRoot,
        expect.objectContaining({ enabled: false })
      );
    });

    it(`should stop at the first failing step and forward its exit code`, async () => {
      mockStaleDevClientState();
      jest.mocked(runExpoAsync).mockResolvedValue(2);

      await expect(devAsync(projectRoot, resolveDevOptions(['--ios']))).resolves.toBe(2);

      expect(runDevServerAsync).not.toHaveBeenCalled();
      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should record the fingerprint of a build that succeeded`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--android']));

      expect(recordLastBuildFingerprint).toHaveBeenCalledWith(
        projectRoot,
        'android',
        fingerprintHash
      );
    });

    it(`should not record a fingerprint of a build that failed`, async () => {
      mockStaleDevClientState();
      jest.mocked(runDevServerAsync).mockResolvedValue(devServerRun({ exitCode: 1 }));

      await expect(devAsync(projectRoot, resolveDevOptions(['--ios']))).resolves.toBe(1);

      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should not record anything when the fingerprint is unavailable`, async () => {
      mockStaleDevClientState({ fingerprint: { hash: null, error: 'fingerprint failed' } });

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(recordLastBuildFingerprint).not.toHaveBeenCalled();
    });

    it(`should reuse a development build recorded for the current fingerprint`, async () => {
      mockStaleDevClientState();
      jest.mocked(readLastBuildFingerprints).mockReturnValue({ ios: fingerprintHash });

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(emitStartPlan).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'dev-client-fresh' }),
        { mode: 'smart', print: 'text', followups: [] }
      );
      expect(runExpoAsync).not.toHaveBeenCalled();
      // `--ios` is an `expo start` option, so it reaches the dev server it asked for.
      expect(runDevServerAsync).toHaveBeenCalledWith(
        projectRoot,
        ['start', '--dev-client', '--ios'],
        { agentSkills: true, output: 'inherit' }
      );
    });

    it(`should warn that expo start options do not reach a build step`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios', '--port', '8082']));

      expect(Log.warn).toHaveBeenCalledWith(expect.stringMatching(/--port 8082/));
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:ios'], {
        agentSkills: true,
        output: 'inherit',
      });
    });

    it(`should not warn about the platform flag the plan already acted on`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(Log.warn).not.toHaveBeenCalled();
    });
  });

  describe('default platform', () => {
    it(`should target iOS on macOS`, async () => {
      mockPlatform('darwin');
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'ios']);
    });

    it(`should target Android on a host that cannot build for iOS`, async () => {
      mockPlatform('linux');
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--platform', 'android']);
    });

    it(`should target the platform of the only checked-in native directory`, async () => {
      mockPlatform('darwin');
      mockStaleDevClientState({ nativeDirs: { ios: false, android: true } });

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['run:android'], {
        agentSkills: true,
        output: 'inherit',
      });
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command
  describe('follow-ups', () => {
    it(`should offer to run the plan --plan just printed`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--plan']));

      expect(emittedFollowUpIds()).toEqual(['dev']);
      expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('npx exagent dev'));
    });

    it(`should explain the build a stale plan includes`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--plan', '--ios']));

      expect(emittedFollowUpIds()).toEqual(['dev', 'build-freshness', 'project-context']);
    });

    // The open step comes first: a dev server serves a bundle and opens nothing, which is the one
    // gap an agent could not close from inside this CLI.
    it(`should offer the open, device and runtime steps once the plan runs`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(emittedFollowUpIds()).toEqual(['open-app', 'real-device', 'runtime-errors']);
      expect(emittedFollowUps()[0]!.command).toBe('npx exagent navigate /');
      expect(emittedFollowUps()[1]!.command).toBe('exp://192.168.1.5:8081');
    });

    it(`should offer the production build when the run needs no device`, async () => {
      vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--web']));

      expect(emittedFollowUpIds()).toContain('eas-build');
    });

    it(`should read the port the dev server was asked for`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--port', '8082']));

      expect(emittedFollowUps()[1]!.command).toBe('exp://192.168.1.5:8082');
    });

    it(`should offer a tunnel for a development build, which needs no exp:// URL`, async () => {
      jest.mocked(readLastBuildFingerprints).mockReturnValue({ ios: fingerprintHash });
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--ios']));

      expect(emittedFollowUpIds()).toContain('real-device-tunnel');
    });

    it(`should leave out the device hint for the web target`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--web']));

      expect(emittedFollowUpIds()).toEqual(['runtime-errors', 'eas-build-configure']);
    });

    it(`should offer nothing with --no-followups, and print no Next section`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--no-followups']));

      expect(emittedFollowUps()).toEqual([]);
      expect(Log.log).not.toHaveBeenCalled();
    });

    it(`should suppress the follow-ups of --plan too`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--plan', '--no-followups']));

      expect(emittedFollowUps()).toEqual([]);
    });

    it(`should keep --no-followups out of the expo start arguments`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--no-followups']));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: true,
        output: 'inherit',
      });
    });

    it(`should never offer more than three follow-ups`, async () => {
      mockStaleDevClientState();

      await devAsync(projectRoot, resolveDevOptions(['--plan', '--ios']));

      expect(emittedFollowUps().length).toBeLessThanOrEqual(3);
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope, §Needs-human protocol
  // The run nobody is watching. `exagent dev --yes` is the documented non-interactive entry point,
  // and on a busy port it used to start nothing, print unparseable stdout, and tell its caller to
  // open another project's app [observed — friction run, 2026-08-23].
  describe('a run with no terminal', () => {
    /** The non-interactive stop of the Expo CLI, verbatim. */
    const NEEDS_INPUT = [
      "Input is required, but 'npx expo' is in non-interactive mode.",
      'Required input:',
      '> Use port 8082 instead?',
    ].join('\n');

    beforeEach(() => {
      jest.mocked(isInteractive).mockReturnValue(false);
    });

    it(`should keep what the steps print, so a stop on a question can be recognised`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions([]));

      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: true,
        output: 'tee',
      });
    });

    it(`should print nothing on stdout before the run in --json mode`, async () => {
      mockProjectState();

      await devAsync(projectRoot, resolveDevOptions(['--json']));

      expect(emitStartPlan).toHaveBeenCalledWith(expect.objectContaining({ rule: 'expo-go' }), {
        mode: 'smart',
        print: 'none',
        followups: [],
      });
      expect(runDevServerAsync).toHaveBeenCalledWith(projectRoot, ['start', '--go'], {
        agentSkills: true,
        output: 'capture',
      });
    });

    it(`should print exactly one JSON object, when the run has ended`, async () => {
      mockProjectState();
      jest
        .mocked(runDevServerAsync)
        .mockResolvedValue(devServerRun({ port: { port: 8082, source: 'log' } }));

      await devAsync(projectRoot, resolveDevOptions(['--json']));

      const printed = jest.mocked(Log.log).mock.calls.map(([line]) => line);
      expect(printed).toHaveLength(1);
      expect(JSON.parse(printed[0]!)).toMatchObject({ rule: 'expo-go', target: 'expo-go' });
    });

    // Exit 7 is the definition of this stop: no re-run of the same command gets past a question.
    it(`should hand a stop on a question back to a person`, async () => {
      mockProjectState();
      jest
        .mocked(runDevServerAsync)
        .mockResolvedValue(devServerRun({ exitCode: 1, stderr: NEEDS_INPUT }));

      await expect(devAsync(projectRoot, resolveDevOptions(['--yes', '--json']))).rejects.toMatchObject({
        isNeedsHuman: true,
        exitCode: 7,
        needsHuman: { scenario: 'expo-prompt', detectedBy: 'exit-signature' },
      });
    });

    it(`should name --port as the way to answer the port question up front`, async () => {
      mockProjectState();
      jest
        .mocked(runDevServerAsync)
        .mockResolvedValue(devServerRun({ exitCode: 1, stderr: NEEDS_INPUT }));

      await expect(
        devAsync(projectRoot, resolveDevOptions(['--yes']))
      ).rejects.toThrow(/npx exagent dev --port 8082/);
    });

    it(`should forward an ordinary failure as it always did`, async () => {
      mockProjectState();
      jest.mocked(runDevServerAsync).mockResolvedValue(devServerRun({ exitCode: 3 }));

      await expect(devAsync(projectRoot, resolveDevOptions([]))).resolves.toBe(3);
    });

    describe('the follow-ups of a run', () => {
      it(`should name the port the dev server reported, not the one it was not given`, async () => {
        mockProjectState();
        jest
          .mocked(runDevServerAsync)
          .mockResolvedValue(devServerRun({ port: { port: 8099, source: 'log' } }));

        await devAsync(projectRoot, resolveDevOptions(['--json']));

        // The open-app step sits first in the ladder; the URL follow-up carries the reported port.
        const commands = emittedFollowUps().map((followup) => followup.command);
        expect(commands).toContain('exp://192.168.1.5:8099');
        expect(commands).not.toContain('exp://192.168.1.5:8081');
      });

      // The bug this exists for: nothing reported a port, so the URL was built on the assumption
      // that 8081 was free — and it was another project's dev server.
      it(`should name no URL when nothing reported a port`, async () => {
        mockProjectState();
        jest
          .mocked(runDevServerAsync)
          .mockResolvedValue(
            devServerRun({ exitCode: 1, port: { port: 8081, source: 'default' } })
          );

        await devAsync(projectRoot, resolveDevOptions(['--json']));

        expect(emittedFollowUpIds()).toContain('dev-server-port-unknown');
        expect(emittedFollowUps().map((followup) => followup.command)).not.toContain(
          'exp://192.168.1.5:8081'
        );
      });
    });
  });
});
